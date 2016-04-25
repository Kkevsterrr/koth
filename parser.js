var fs = require('fs');
var teams = {"Green" : "green", "Blue" : "blue", "Red" : "red" }

network = {};
network["nodes"] = [];
network["edges"] = [];
GAME_NAME = "koth2";

c = JSON.parse(fs.readFileSync(__dirname + "/games/" + GAME_NAME + "/cypher.json"), 'utf-8')
rids = {}
function getPorts(name) {
    console.log(name);
    if(name.toLowerCase().indexOf("gbox") > -1) { //george vm 1
       return [21, 22, 23, 25, 80];
   } else if(name.toLowerCase().indexOf("win") > -1) { //windows
       return [22, 80, 3389];
   } else if(name.toLowerCase().indexOf("internal1") > -1) { //metasploitable
        return [21, 22, 23, 25, 80, 2049, 3306, 5900];
    } else if(name.toLowerCase().indexOf("internal2") > -1) { //bee-bug
        return [21, 22, 25, 80, 666, 3306];
    } else {
        return [21, 22, 23, 25, 80, 3306];
    }
}
for (var i = 0; i < c["machines"].length; i++) {
    m = c["machines"][i];
    if (m["name"].indexOf("Hidden") != -1) {
        continue;
    }
    machine = {};
    machine["data"] = {};
    machine["data"]["id"] = m["name"].replace(/ /g,'');
    machine["data"]["weight"] = 5;
    machine["data"]["ports"] = getPorts(machine["data"]["id"]);

    if(isEntry(m["name"]) != undefined) { //If this is an entry box
        machine["data"]["color"] = isEntry(m["name"]);
        machine["data"]["name"] = m["name"];
        //console.log(m);
        machine["data"]["forwarded"] = m["network_connections"]["forward_ports"];
    } else {
        machine["data"]["color"] = "grey";
        machine["data"]["name"] = "";
    }
    if(m["name"] == "Scorebot") {
        machine["data"]["name"] = m["name"];
        machine["data"]["color"] = "black";
        machine["data"]["weight"] = 1000;

        //continue;
    }

    machine["data"]["ip"] = [];

    for(var j = 0; j < m["connections"].length; j++) {
        machine["data"]["ip"].push(m["connections"][j]["ip"]);
        if(rids[m["connections"][j]["network"]] == undefined) {
            rids[m["connections"][j]["network"]] = [];
        }
        rids[m["connections"][j]["network"]].push(m["name"].replace(/ /g,''));
    }
    network["nodes"].push(machine);
    //console.log(machine)
}
r = 1;
scorebot = false;
for(var i = 0; i < c["networks"].length; i++) {
    router = {"data" : {}}
    if (rids[c["networks"][i]["id"]] != undefined && c["networks"][i]["physical_network"] == null) {
        router["data"]["ip"] = [c["networks"][i]["ip"]];
        console.log(c["networks"][i]);
        router["data"]["id"] = "router_" + c["networks"][i]["id"];
        router["data"]["name"] = "Router " + r++;
        router["data"]["weight"] = 5;
        router["data"]["color"] = "black";
        network["nodes"].push(router);
        net = c["networks"][i]["id"];
        for(var j = 0; j < rids[net].length; j++) {
            if (rids[net][j] == "Scorebot" && scorebot) {
                continue;
            }
            edge = {}
            edge["data"] = {}
            edge["data"]["source"] = rids[net][j];
            console.log(rids[net][j] + " --> " + net);
            edge["data"]["target"] = "router_" + net;
            edge["data"]["color"] = "black";
            edge["data"]["strength"] = 10;
            //console.log(rids[net][j]);
            if(rids[net][j] == "Scorebot") {
                console.log("Set");
                edge["data"]["strength"] = 0;
                scorebot = true;
            }

            network["edges"].push(edge);
        }
    }
}
fs.writeFile("games/"+GAME_NAME+"/test.json", JSON.stringify(network, null, 2), 'utf-8');
//console.log(network);

function isEntry(name) {
    for(team in teams) {
        if (name.indexOf(team) > -1) {
            return teams[team];
        }
    }
    return undefined;
}
