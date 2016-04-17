var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var colors = require('colors');
var evilscan = require("evilscan");
var async = require('async');
var e = require('events');
require('events').EventEmitter.prototype._maxListeners = 0;


var GAME_NAME = "koth1";
var CLAIM_DELAY = 30000;
var SCAN_DELAY = 60000;

var index = fs.readFileSync(__dirname + '/index.html');
var path = __dirname + "/games/" + GAME_NAME + "/saved/network";

var claim_times = {};
var ports = {};
var ownership = {};
var scores = {}
var messages = []
var chart_scores = []
var teams = { "Green" : "green", "Red": "red", "Blue": "blue"}
var network = initialize_network();

var d = new Date();

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

var scorebot = http.createServer(function(req, res) {
    if(req.method=='POST') {
        var body='';
        req.on('data', function (data) {
            body +=data;
        });
        req.on('end',function() {
            var team = qs.parse(body)["team"];
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

            id = check_valid(ip);
            if(teams[team] != undefined) {
                now = new Date();

                if(id in claim_times && team in claim_times[id] && now.getTime() - claim_times[id][team] < CLAIM_DELAY) {
                    res.write("Cannot claim box - please wait.");
                    claim_times[id][team] = now.getTime()
                } else if(ownership[id] == team) {
                    res.write("Team already owns this box - cannot reclaim.");
                    claim_times[id][team] = now.getTime()
                } else {
                    if(!(ip in claim_times)) {
                        claim_times[id] = {}
                    }
                    claim_times[id][team] = now.getTime();
                    claim_machine(check_valid(ip), team);
                    ownership[id] = team;
                    messages.push(pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + " - <span class=\"ui " + teams[team] + " small inverted header\">" + team.cap() + "<\/span> team has claimed " + id + "<br/>");
                    console.log(messages);
                    res.write("Box claimed for team " + team + ".");
                    console.log("Box " + id + " ("+ip+") claimed for team " + team + ".");
                    save_network();
                }
            } else {
                res.write("Unknown team.")
            }
            res.end();
        });
    }
});


app.listen(3000);
scorebot.listen(8000);
scanner = setInterval(function() { scan_net() }, SCAN_DELAY);

var io = require('socket.io').listen(app);
//scan_net()
String.prototype.cap = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function scan_net() {
    io.sockets.emit('scan', { chart: calculate_score(), ports: ports, graph: network} )
    console.log("Starting network wide scan...");
    scans = []
    for(var i = 0; i< network["nodes"].length; i++) {
        node = network["nodes"][i];
        ip = node["data"]["ip"][0];
        id = node["data"]["id"];
        if(ip != "::ffff:127.0.0.1" && ip.indexOf("/16") == -1 && teams[id] == undefined && node["data"]["name"] != "Scorebot") {
            scan_box(ip, id);
        }
    }
}

function scan_box(ip, id) {
    options = {
        target:ip,
        port:Object.keys(ports[id]),
        status:'TROU', // Timeout, Refused, Open, Unreachable
        banner:false
    };

    var scanner = new evilscan(options);

    scanner.on('result',function(data) {
        if(data["status"].indexOf("closed") != -1) {
            ports[id][data["port"]] = "closed";
        } else {
            ports[id][data["port"]] = "open";
        }
    });
    scanner.run();
}


function claim_machine(id, team) {
    if(id == "") {
        return false;
    } else {
        for(var i = 0; i< network["nodes"].length; i++) {
            node = network["nodes"][i];
            if (node["data"]["id"] == id) {
                node["data"]["color"] = teams[team];
                io.sockets.emit('update', { id: id, color: teams[team] } )
            }
        }
    }
    return true;
}

function pad(i) { return (i < 10 ? "0" : "") + i }
function first(arr) { return arr[0].toLowerCase(); }
function get_team_by_color(color) {
    for(team in teams) {
        if(teams[team] == color) { return team; }
    }
    return null;
}

function calculate_score() {
    console.log("Calculating score..");
    s = {};
    ret = [];
    for(var i = 0; i < network["nodes"].length; i++) {
        node = network["nodes"][i];
        owner = get_team_by_color(node["data"]["color"]);
        id = node["data"]["id"];

        if(owner in teams) {
            s[owner] = s[owner] + 1 || 1
            for(port in ports[id]) {
                if(ports[id][port] == "open") {s[owner] += 3}
            }
        }
    }
    console.log(s);
    for(var team in s) {
        if(scores[team] == undefined) {
            scores[team] = [s[team]]
        } else {
            scores[team].push(s[team])
        }
    }
    console.log(scores);
    var i = 0;
    for(team in scores) {
        ret[i] = [team]
            ret[i] = ret[i].concat(scores[team])
            i++;
    }
    chart_scores = ret;
    return chart_scores;
}

function check_valid(ip) {
    for(var i = 0; i< network["nodes"].length; i++) {
        node = network["nodes"][i];
        if (node["data"]["ip"].indexOf(ip) > -1) { return node["data"]["id"]; }
    }
    return "";
}

function save_network() {
    fs.writeFile(path, JSON.stringify(network, null, 4), 'utf-8', function(err) {
        if(err) { return console.log(err); }
    });
}

function initialize_network() {
    net = {};
    try {
        process.stdout.write("Reading save data file for " + GAME_NAME + "...");
        net = JSON.parse(fs.readFileSync(path, 'utf8'));
        console.log("done".green);
    } catch (e) {
        try {
            console.log("failed".yellow);
            init = __dirname + "/games/" + GAME_NAME + "/test.json";
            process.stdout.write("Reading initialization file for " + GAME_NAME + "...");
            net = JSON.parse(fs.readFileSync(init, 'utf8'));
            console.log("done".green);
        } catch (e) {
            console.log(e);
            console.log("ERROR: No init or save file found.");
            return {};
        }
    }

    // Initialize ports & ownership
    for(var i = 0; i< net["nodes"].length; i++) {
        node = net["nodes"][i];
        ip = node["data"]["ip"][0];
        id = node["data"]["id"];
        ownership[id] = "none";
        if(ip != "::ffff:127.0.0.1" && ip.indexOf("/16") == -1 && teams[id] == undefined && node["data"]["name"] != "Scorebot") {
        ports[id] = {};
        if (node["data"]["name"].indexOf("Router") == -1) {
            for(j = 0; j < node["data"]["ports"].length; j++) {
                ports[id][node["data"]["ports"][j]] = "closed";
            }
            ownership[id] = (teams[id] != undefined) ? teams[id] : "none";
        }
    }
    }
    return net;
}

// Emit current data on connection
io.on('connection', function(socket) {
    socket.emit('data', { graph: network, chart: chart_scores, colors: chart_scores.map(first), messages: messages, ports: ports });
});
