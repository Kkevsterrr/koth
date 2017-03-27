'use strict';

var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var colors = require('colors');
var evilscan = require("evilscan");
var async = require('async');
var express = require('express');
var e = require('events');
var bodyParser = require("body-parser");
var path_module = require('path');

require('events').EventEmitter.prototype._maxListeners = 0;

var GAME_NAME = "test";
var CLAIM_DELAY = 30000;
var SCAN_DELAY = 10000;
var PORT_OPEN_SCORE = 3;
var PORT_CLOSED_SCORE = 0;
var BOX_OWNERSHIP_SCORE = 1;
var EXP_SCORING = true;
var EXP_VAL = 60;
var ONLY_SCAN_OWNED_BOXES = true;
var d = new Date();

var path = __dirname + "/games/" + GAME_NAME;
var save_path = path + "/saved/network";
var checks_path = "./checks";
var services = {
    "FTP": "CheckPort",
    "HTTP": "CheckPort",
};
var environment = {};
environment["ownership"] = {};
environment["claim_times"] = {}
environment["scores"] = {};
environment["ports"] = {};
environment["messages"] = [];
environment["scoring_iteration"] = 0;
environment["chart_scores"] = [];
environment["teams"] = {"Red Team" : "red", "Blue Team" : "blue", "Green Team" : "green"};
environment["ignore"] = [];
initialize_network(); //generate the gui graph

var index = fs.readFileSync(__dirname + '/index.html');
var app = require('express')();
var server = require('http').Server(app);
var scorebot = require('express')();
var scorebot_server = require('http').Server(scorebot);
var io = require('socket.io')(server);
var checks = {};
var scanner;

import_checks(checks_path).then(function (cs) {
    checks = cs;
    scanner = setInterval(function() { scan_net() }, SCAN_DELAY);
}).catch(function(err) {
    console.log(err);
    console.log('Failed to import checks: ');
});

//set up routing information
app.use('/static', express.static('./static'));
scorebot.use(bodyParser.urlencoded({ extended: false }));
scorebot.use(bodyParser.json());
server.listen(3000);
scorebot.listen(8000);

app.get('/', function (req, res) { res.sendFile(__dirname + '/index.html'); });
scorebot.get("/", function (req, res) { handle(req, res, req.param("team")); });
scorebot.post("/", function(req, res) { handle(req, res, req.body.team); });

calculate_score();
// Emit current data on connection
io.on('connection', function(socket) {
    socket.emit('data', {
        graph: environment["graph"],
        chart: environment["chart_scores"],
        teams: environment["teams"],
        messages: environment["messages"],
        services: environment["services"],
        machines: environment["machines"],
        ignore: environment["ignore"]
    });
});

function handle(req, res, color) {
    var body='';
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    ip = ip.replace("::ffff:", "");
    var claim_times = environment["claim_times"];
    var name = check_valid(ip);

    var team_name = get_team_by_color(color);
    console.log(("[!] Attempted claim from " + ip + " on machine " + name + " for color " + color + " for team " + team_name+"").yellow);
    if(team_name in environment["teams"] && name != "") {
        var now = new Date();

        if(name in claim_times && team_name in claim_times[name] && now.getTime() - claim_times[name][team_name] < CLAIM_DELAY) {
            res.write("Cannot claim box - please wait.");
            claim_times[name][team_name] = now.getTime()
        } else if(environment["machines"][name]["owner"] == team_name) {
            res.write("Your team already owns this box - cannot reclaim.");
            if(!(name in claim_times)) {
                claim_times[name] = {}
            }
            claim_times[name][team_name] = now.getTime()
        } else {
            if(!(name in claim_times)) {
                claim_times[name] = {}
            }
            claim_times[name][team_name] = now.getTime();
            claim_machine(name, team_name);
            environment["machines"][name]["owner"] == team_name;
            environment["messages"].push(pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + " - <span class=\"ui " + environment["teams"][team_name] + " small inverted header\">" + team_name.cap() + "<\/span> team has claimed " + name + "<br/>");
            res.write("Box claimed for team " + team_name + ".");
            console.log(("[*] Box " + name + " ("+ip+") claimed for team " + team_name + ".").green);
        }
    } else {
        res.write("Unknown team or machine.")
    }
    res.end();
}

String.prototype.cap = function() { return this.charAt(0).toUpperCase() + this.slice(1); }
Array.prototype.last = function() { return this[this.length - 1]; }
function pad(i) { return (i < 10 ? "0" : "") + i }
function first(arr) { return arr[0].toLowerCase(); }
function get_color(team_name) { return environment["teams"][team_name]; }
function get_check(check_name) {
    if (check_name in services) {
        return services[check_name];
    } else {
        return "CheckPort";
    }
}
function is_entry(name) {
    for(team in teams) {
        if (name.indexOf(team) > -1) {
            return teams[team];
        }
    }
    return undefined;
}
function count_open_ports(services) {
    var num_open = 0;
    for(var service_name in services) {
        var service = services[service_name];
        if(service["status"] == "open") {
            num_open += 1;
        }
    }
    return num_open;
}

function import_checks(path) {
    var checks = {}
    return new Promise(function (fulfill, reject) {
        fs.readdir(path, function(err, files) {
            var f, l = files.length;
            for (var i = 0; i < l; i++) {
                f = path_module.join(path, files[i]);
                if (fs.lstatSync(f).isFile()) {
                    var mod = require("./" + f);
                    checks[mod.name] = mod
                }
            }
            fulfill(checks);
        });
    });
}

function scan_net() {
    console.log("[*] Scanning network and pushing results to clients.");
    var all_services = [];
    var check_funcs = [];
    var machines = Object.keys(environment["machines"]);
    for(var i = 0; i < machines.length; i++) {
        var machine = environment["machines"][machines[i]];
        if (machine["name"].indexOf("Entry") == -1 && (!ONLY_SCAN_OWNED_BOXES || (ONLY_SCAN_OWNED_BOXES && machine["owner"] != "none"))) {
            var local_services = Object.keys(machine["services"]);
            all_services = all_services.concat(local_services);
            for (var j = 0; j < local_services.length; j++) {
                var check_name = get_check(local_services[j]);
                var mod = new checks[check_name](machine["name"], get_ip(machine), machine["services"][local_services[j]]);
                check_funcs.push(mod.check());
            }
        }
    }
    async.parallel(check_funcs, function(err, result) {
        for (i = 0; i < result.length; i++) {
            environment["machines"][result[i]["name"]]["services"][all_services[i]]["status"] = result[i]["status"];
            var num_open = count_open_ports(environment["machines"][result[i]["name"]]["services"]);
            environment["machines"][result[i]["name"]]["status"] = num_open.toString() + "/" + Object.keys(environment["machines"][result[i]["name"]]["services"]).length.toString();
            environment["machines"][result[i]["name"]]["percentage"] = Math.floor((num_open / Object.keys(environment["machines"][result[i]["name"]]["services"]).length) * 100);
        }
        io.sockets.emit('scan', {
            chart: calculate_score(),
            graph: environment["graph"],
            machines: environment["machines"],
            team: environment["teams"]
        });
    });
}

function claim_machine(name, team_name) {
    if(name in environment["machines"]) {
        environment["machines"][name]["color"] = environment["teams"][team_name];
        environment["machines"][name]["owner"] = team_name;
        io.sockets.emit('update', { id: environment["machines"][name]["id"], color: environment["teams"][team_name] });
        return true;
    } else {
        return false;
    }
}

function get_team_by_color(color) {
    for(var team_name in environment["teams"]) {
        if(environment["teams"][team_name] == color) { return team_name; }
    }
    return null;
}

function calculate_score() {
    environment["scoring_iteration"] += 1;
    var s = {};
    var ret = [];
    for(var name in environment["machines"]) {
        var machine = environment["machines"][name];
        var owner = machine["owner"];
        var id = machine["id"];

        if(owner in environment["teams"]) {
            var val = BOX_OWNERSHIP_SCORE;
            val += environment["scoring_iteration"] / EXP_VAL*val;
            val = Math.round(val * 100) / 100

            s[owner] = s[owner] + val || val
            var num_open = 0;
            for(var service in machine["services"]) {

                val = 0.0;
                if(machine["services"][service]["status"] == "open") {
                    val = PORT_OPEN_SCORE
                    num_open += 1;
                } else {
                    val = -1 * PORT_CLOSED_SCORE
                }
                val += environment["scoring_iteration"] / EXP_VAL*val
                val = Math.round(val * 100) / 100
                s[owner] += val + environment["scoring_iteration"]/EXP_VAL*val;
            }
        }
    }
    for(var team in s) {
        if(environment["scores"][team] == undefined) {
            environment["scores"][team] = [s[team]];
        } else {
            environment["scores"][team].push(environment["scores"][team].last() + s[team]);
        }
    }
    var i = 0;
    for(team in environment["scores"]) {
        ret[i] = [team].concat(environment["scores"][team]);
        i++;
    }
    //console.log(ret);
    environment["chart_scores"] = ret;

    save_network();
    return environment["chart_scores"];
}

function check_valid(ip) {
    for(var name in environment["machines"]) {
        var machine = environment["machines"][name];
        if (machine["ip"].indexOf(ip) > -1) { return machine["name"]; }
    }
    return "";
}

function save_network() {
    /*fs.writeFileSync(save_path, JSON.stringify(environment, null, 4), 'utf-8', function(err) {
        if(err) { return console.log(err); }
    });*/
}

function initialize_network() {
    if (fs.existsSync(save_path)) {
        process.stdout.write("[*] Reading save data file for " + GAME_NAME + "...");
        environment = JSON.parse(fs.readFileSync(save_path, 'utf8'));
        console.log("done".green);
    } else {
        try {
            //init = ; // /games/" + GAME_NAME +
            process.stdout.write("[*] Reading initialization file for " + GAME_NAME + "...");
            var network = JSON.parse(fs.readFileSync("games/"+GAME_NAME+"/network.json", 'utf8'));
            var graph = {};
            graph["nodes"] = [];
            graph["edges"] = [];
            for(var router_id in network["routers"]) {
                var router = network["routers"][router_id];
                var node = {};
                node["data"] = {};
                node["data"]["id"] = router["id"];
                node["data"]["name"] = router["name"];
                node["data"]["weight"] = 5;
                node["data"]["color"] = "black";
                node["data"]["ip"] = router["ip"];
                graph["nodes"].push(node);
            }
            for(var name in network["machines"]) {
                var machine = network["machines"][name];
                var id = machine["id"]
                environment["ownership"][id] = machine["owner"];
                for(var j = 0; j < machine["connections"].length; j++) {
                    if(machine["connections"][j] in network["routers"]) {
                        var edge = {}
                        edge["data"] = {}
                        edge["data"]["source"] = machine["connections"][j];
                        edge["data"]["target"] = id;
                        edge["data"]["color"] = "black";
                        edge["data"]["strength"] = 10;
                        graph["edges"].push(edge);
                    }
                }
                var node = {};
                node["data"] = {};
                node["data"]["name"] = name;
                node["data"]["id"] = machine["id"];
                node["data"]["weight"] = 5;
                node["data"]["color"] = machine["color"];
                node["data"]["ip"] = machine["ip"];
                graph["nodes"].push(node);
            }
            environment["graph"] = graph;
            environment["machines"] = network["machines"];
            console.log("done".green);
        } catch (e) {
            console.log(e);
            console.log(e.stack);
            console.log("ERROR: No init or save file found.");
            return {};
        }
    }


}

function get_ip(machine) {
    for (var j = 0; j < machine["ip"].length; j++) {
        if (machine["ip"][j] != null) {
            return machine["ip"][j];
        }
    }
}
