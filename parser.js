var fs = require('fs');
var valid_teams = {"green" : "green", "blue" : "blue", "red" : "red" }

network = {};
network["nodes"] = [];
network["edges"] = [];
GAME_NAME = "koth1";

c = JSON.parse(fs.readFileSync(__dirname + "/games/" + GAME_NAME + "/cypher.json"), 'utf-8')
rids = {}

for (var i = 0; i < c["machines"].length; i++) {
    m = c["machines"][i];
    machine = {};
    machine["data"] = {};
    machine["data"]["id"] = m["name"].replace(/ /g,'');
    machine["data"]["weight"] = 65;
    machine["data"]["ports"] = [22, 80]

    if(valid_teams[m["name"].toLowerCase()] != undefined) { //If this is an entry box
        machine["data"]["color"] = m["name"].toLowerCase();
        machine["data"]["name"] = m["name"];
        console.log(m);
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
    console.log(machine)
}
r = 1;
for(var i = 0; i < c["networks"].length; i++) {
    router = {"data" : {}}
    if (rids[c["networks"][i]["id"]] != undefined && rids[c["networks"][i]["id"]].length > 1) {
        router["data"]["ip"] = [c["networks"][i]["ip"]];
        router["data"]["id"] = "router_" + c["networks"][i]["id"];
        router["data"]["name"] = "Router " + r++;
        router["data"]["weight"] = 65;
        router["data"]["color"] = "black";
        network["nodes"].push(router);
        net = c["networks"][i]["id"]
            for(var j = 0; j < rids[net].length; j++) {
                edge = {}
                edge["data"] = {}
                edge["data"]["source"] = rids[net][j];
                console.log(rids[net][j] + " --> " + net);
                edge["data"]["target"] = "router_" + net;
                edge["data"]["color"] = "black";
                edge["data"]["strength"] = 10;
                console.log(rids[net][j]);
                if(rids[net][j] == "Scorebot") {
                    console.log("Set");
                    edge["data"]["strength"] = 1000;
                }
                network["edges"].push(edge);
            }
    }
}
fs.writeFile("games/koth1/test.json", JSON.stringify(network, null, 2), 'utf-8');
//console.log(network);
