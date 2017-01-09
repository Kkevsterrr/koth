var fs = require('fs');
var teams = {"Red" : "red", "Blue" : "blue", "Green" : "green", "Purple" : "purple", "Yellow": "yellow"}

network = {};

GAME_NAME = "redblue1";
DEFAULT_PORT_STATE = "open";
cipherpath_json = JSON.parse(fs.readFileSync("./cypher.json"), 'utf-8');
rids = {}
machines = {};

function get_ports(name) {
    console.log(name);
    if(name.toLowerCase().indexOf("gvm2") > -1) { //george vm 1
       return [7,21,22,80,81];
   } else if(name.toLowerCase().indexOf("gvm1") > -1) { //george vm 2
        return [21,22,25,80,587];
    } else if(name.toLowerCase().indexOf("m3") > -1) { //windows
       return [21,22,80,1617,3306,4848,8080,8181];
   } else if(name.toLowerCase().indexOf("win7") > -1) { //kali half pivots
       return [22, 80, 3389, 5357, 8080];
   } else if(name.toLowerCase().indexOf("2012") > -1 ) { //kali full pivots
        return [21,22,23,53,80,443,3389];
    } else if(name.toLowerCase().indexOf("m2") > -1) { //lets chat
        return [21, 22, 80, 3306, 6667];
    } else {
        return [21, 22, 23, 25, 80, 3306];
    }
}
//console.log(cipherpath_json["machines"])
machines = {}
for (var i = 0; i < cipherpath_json["machines"].length; i++) {
    cm = cipherpath_json["machines"][i];
    name = cm["name"];
    if (name.indexOf("Hidden") != -1) { continue; }

    m = {}
    m["name"] = name
    m["id"] = name.replace(/ /g,'');
    m["forwarded_ports"] = cm["network_connections"]["forward_ports"];
    ports = get_ports(name);
    m["ports"] = {};
    for(var j = 0; j < ports.length; j++) {
        m["ports"][ports[j]] = DEFAULT_PORT_STATE;
    }
    color = get_color(name);
    m["color"] = color;
    m["status"] = ports.length+"/"+ports.length;
    m["percentage"] = "100";
    m["ip"] = [];
    m["owner"] = get_owner(name);
    for(var j = 0; j < cm["connections"].length; j++) {
        connection = cm["connections"][j];
        m["ip"].push(connection["ip"]);
        (m["connections"] = m["connections"] || []).push(connection["network"]);
        (rids[connection["network"]] = rids[connection["network"]] || []).push(m["id"]);
    }
    machines[name] = m;
}
console.log(rids)
console.log(machines)
routers = {}
r = 1
for(var i = 0; i < cipherpath_json["networks"].length; i++) {
    network = cipherpath_json["networks"][i];
    router = {}
    if (rids[network["id"]] != undefined && network["physical_network"] == null && network["mode"] != 'physical') { // if someone is connected and it's not a physical network
        router["ip"] = [network["ip"]];
        router["id"] = network["id"];
        router["name"] = "Router " + r++;
        routers[router["id"]] = router;
    }
}
console.log(routers);
network["machines"] = machines;
network["routers"] = routers;
fs.writeFileSync("network.json", JSON.stringify(network, null, 2), 'utf-8');

exit()





network["nodes"] = [];
network["edges"] = [];

for (var i = 0; i < cipherpath_json["machines"].length; i++) {
    m = cipherpath_json["machines"][i];
    name = m["name"];
    if (name.indexOf("Hidden") != -1) { continue; }
    machines[m] = {};
    node = {};
    node["data"] = {};
    node["data"]["id"] = m["name"].replace(/ /g,'');
    node["data"]["weight"] = 5;
    color = get_color(m["name"]);
    //if(isEntry(m["name"]) != undefined) { //If this is an entry box

        node["data"]["name"] = m["name"];
        //console.log(m);
        //machine["data"]["ports"] = [];
        node["data"]["forwarded"] = m["network_connections"]["forward_ports"];
        node["data"]["ports"] = getPorts(node["data"]["id"]); // returns a list of ports to hold open as linked by machine name
        node[m]["ports"] = {};
        for(var port in node["data"]["ports"]) {
            machines[m]["ports"][port] = "open";
        }
/*    } else {
        machine["data"]["color"] = "grey";
        machine["data"]["name"] = "";
        machine["data"]["ports"] = getPorts(machine["data"]["id"]);

    }*/
    if(name == "Scorebot") {
        node["data"]["name"] = m["name"];
        color = "black";
        node["data"]["weight"] = 1000;

        //continue;
    }
    node["data"]["color"] = color;
    node["data"]["ip"] = [];

    for(var j = 0; j < m["connections"].length; j++) {
        node["data"]["ip"].push(m["connections"][j]["ip"]);
        if(rids[m["connections"][j]["network"]] == undefined) {
            rids[m["connections"][j]["network"]] = [];
        }
        rids[m["connections"][j]["network"]].push(m["name"].replace(/ /g,''));
    }
    network["nodes"].push(node);
    //console.log(machine)
}
r = 1;
scorebot = false; // so the scorebot is only connected visually once
for(var i = 0; i < cipherpath_json["networks"].length; i++) {
    router = {"data" : {}}
    if (rids[cipherpath_json["networks"][i]["id"]] != undefined && cipherpath_json["networks"][i]["physical_network"] == null && cipherpath_json["networks"][i]["mode"] != 'physical') {
        router["data"]["ip"] = [cipherpath_json["networks"][i]["ip"]];
        console.log(cipherpath_json["networks"][i]);
        router["data"]["id"] = "router_" + cipherpath_json["networks"][i]["id"];
        router["data"]["name"] = "Router " + r++;
        router["data"]["weight"] = 5;
        router["data"]["color"] = "black";
        network["nodes"].push(router);
        net = cipherpath_json["networks"][i]["id"];
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
fs.writeFile("test.json", JSON.stringify(network, null, 2), 'utf-8');
console.log(network);

function get_owner(name) {
    if(name == "Scorebot") {
        return "none";
    }
    for(team in teams) {
        if (name.indexOf(team) > -1) {
            return team;
        }
    }
    return "none";
}

function get_color(name) {
    if(name == "Scorebot") {
        return "black";
    }
    for(team in teams) {
        if (name.indexOf(team) > -1) {
            return teams[team];
        }
    }
    return "grey";
}
