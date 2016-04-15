var http = require('http'),
    fs = require('fs'),
    index = fs.readFileSync(__dirname + '/index.html');
var qs = require('querystring');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});
var colors = require('colors');
var claims = {};
var GAME_NAME = "koth1";
var CLAIM_DELAY = 30000;
var valid_teams = { "green" : "green", "red": "red", "blue": "blue" }
var path = __dirname + "/games/" + GAME_NAME + "/saved/network";
var scores = {}
var messages = []
var chart_scores = []
var d = new Date();
var elements = read_data();
var evilscan = require("evilscan");
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
            if(valid_teams[team] != undefined) {
                now = new Date();

                if(id in claims && team in claims[id] && now.getTime() - claims[id][team] < CLAIM_DELAY) { 
                    res.write("Cannot claim box - please wait.");
                    claims[id][team] = now.getTime()
                } else if(true) { //TODO: IF TEAM ALREADY OWNS THE BOX!!!!
                    res.write("Team already owns this box - cannot reclaim.");
                    claims[id][team] = now.getTime()
                } else {
                    if(!(ip in claims)) {
                        claims[id] = {}
                    }
                    claims[id][team] = now.getTime();
                    claim_machine(check_valid(ip), team);
                    messages.push(pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + " - <span class=\"ui " + valid_teams[team] + " small inverted header\">" + team.cap() + "<\/span> team has claimed " + id + "<br/>");
                    console.log(messages);
                    res.write("Box claimed for team " + team + ".");
                    console.log("Box " + id + " ("+ip+") claimed for team " + team + ".");
                    write_network();
                }
            } else {
                res.write("Unknown team.")
            }
            res.end();
        });
    }
});



calculate_score();
app.listen(3000);
scorebot.listen(8000);
var io = require('socket.io').listen(app);
String.prototype.cap = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function scan_box(ip, id) {
    console.log("scanning" +ip);
    options = {
        target:ip,
        port:'22',
        status:'TROU', // Timeout, Refused, Open, Unreachable
        banner:true
    };

    var scanner = new evilscan(options);

    scanner.on('result',function(data) {
        // fired when item is matching options
        console.log(data);
    });
    scanner.run();

}


function claim_machine(id, team) {
    if(id == "") {
        return false
    } else {
        for(var i = 0; i< elements["nodes"].length; i++) {
            node = elements["nodes"][i]
                if (node["data"]["id"] == id) { 
                    node["data"]["color"] = valid_teams[team];
                    io.sockets.emit('update', { id: id, color: valid_teams[team], chart: calculate_score()} )
                } 
        }
    }
}

function pad(i) {
    return (i < 10 ? "0" : "") + i
}


function first(arr) { return arr[0]; }
function calculate_score() {
    s = {}
    ret = []
        for(var i = 0; i < elements["nodes"].length; i++) {
            node = elements["nodes"][i];
            if(node["data"]["color"] in valid_teams) {
                s[node["data"]["color"]] = s[node["data"]["color"]] + 1 || 1
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
    for(var i = 0; i< elements["nodes"].length; i++) {
        node = elements["nodes"][i]
            if (node["data"]["ip"].indexOf(ip) > -1) { return node["data"]["id"]; }
    }
    return ""
}

function write_network() {
    fs.writeFile(path, JSON.stringify(elements, null, 4), 'utf-8', function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
}
function read_data() {
    try {
        process.stdout.write("Reading save data file for " + GAME_NAME + "...");
        net = JSON.parse(fs.readFileSync(path, 'utf8'));
        console.log("done".green);
        return net
    } catch (e) {
        try {
            console.log("failed".red);
            init = __dirname + "/games/" + GAME_NAME + "/init.json";
            init = __dirname + "/games/" + GAME_NAME + "/test.json";

            process.stdout.write("Reading initialization file for " + GAME_NAME + "...");
            net = JSON.parse(fs.readFileSync(init, 'utf8'));
            console.log("done".green);
            return net
        } catch (e) {
            console.log(e)
                console.log("ERROR: No init or save file found.")
                return {}
        }
    }
}



// Emit current data on connection
io.on('connection', function(socket) {
    socket.emit('data', { graph: elements, chart: chart_scores, colors: chart_scores.map(first), messages: messages });
});

