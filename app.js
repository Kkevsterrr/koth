require("autoinstall")

var http = require('http'),
    fs = require('fs'),
    index = fs.readFileSync(__dirname + '/index.html');
var qs = require('querystring');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});
var valid_teams = { "green" : "green", "purple": "purple" }
var scorebot = http.createServer(function(req, res) {
    if(req.method=='POST') {
        var body='';
        req.on('data', function (data) {
            body +=data;
        });
        req.on('end',function() {
            var team = qs.parse(body)["team"];
            console.log(team);
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
            
            console.log(ip);
            if(valid_teams[team] != undefined) {
                claim_machine(check_valid(ip), team);
                res.write("Box claimed for team " + team + ".");
            } else {
                res.write("Unknown team.")
            }
            res.end();
        });
    }
});
app.listen(3000);
scorebot.listen(8000);
var io = require('socket.io').listen(app);


var elements = {
    nodes: [
    { data: { id: 'green', name: 'Green Team', weight: 65, color: 'green', ip: "::ffff:127.0.0.10"} },
    { data: { id: 'n1', name: '', weight: 65, color: 'grey', ip: "::ffff:127.0.0.1" } },
    { data: { id: 'n2', name: '', weight: 65, color: 'grey' , ip: "::ffff:127.0.0.10"} },
    { data: { id: 'router1', name: 'Router 1', weight: 65, color: 'black' }, ip: "::ffff:127.0.0.10" },
    { data: { id: 'sp', name: '', weight: 65, color: 'grey' , ip: "::ffff:127.0.0.10"} },
    { data: { id: 'ip1', name: '', weight: 65, color: 'grey' }, ip: "::ffff:127.0.0.10" },
    { data: { id: 'ip2', name: '', weight: 65, color: 'grey' , ip: "::ffff:127.0.0.10"} },
    { data: { id: 'router2', name: 'Router 2', weight: 65, color: 'black' , ip: "::ffff:127.0.0.10"} },
    { data: { id: 'n6', name: '', weight: 65, color: 'grey' }, ip: "::ffff:127.0.0.10" },
    { data: { id: 'n7', name: '', weight: 65, color: 'grey' }, ip: "::ffff:127.0.0.10" },
    { data: { id: 'purple', name: 'Purple Team', weight: 65, color: 'purple' }, ip: "::ffff:127.0.0.10" },
    ],

    edges: [
    { data: { source: 'green', target: 'router1', color: 'black', strength: 10 } },
    { data: { source: 'purple', target: 'router2', color: 'black', strength: 10 } },
    { data: { source: 'n1', target: 'router1', color: 'black', strength: 10 } },
    { data: { source: 'n2', target: 'router1', color: 'black', strength: 10 } },
    { data: { source: 'sp', target: 'router1', color: 'black', strength: 10 } },
    { data: { source: 'sp', target: 'router2', color: 'black', strength: 10 } },
    { data: { source: 'ip1', target: 'router1', color: 'black', strength: 10 } },
    { data: { source: 'ip1', target: 'router2', color: 'black', strength: 10 } },
    { data: { source: 'ip2', target: 'router1', color: 'black', strength: 10 } },
    { data: { source: 'ip2', target: 'router2', color: 'black', strength: 10 } },
    { data: { source: 'n6', target: 'router2', color: 'black', strength: 10 } },
    { data: { source: 'n7', target: 'router2', color: 'black', strength: 10 } }

    ]

}

function claim_machine(id, team) {
    if(id == "") {
        return false
    } else {
        for(var i = 0; i< elements["nodes"].length; i++) {
            node = elements["nodes"][i]
            if (node["data"]["id"] == id) { 
                node["data"]["color"] = valid_teams[team]
                io.sockets.emit('update', { id: id, color: valid_teams[team] } )
            } 
        }
        console.log(elements)
    }
}


function check_valid(ip) {
    for(var i = 0; i< elements["nodes"].length; i++) {
        node = elements["nodes"][i]
        if (node["data"]["ip"] == ip) { return node["data"]["id"]; }
    }
    return ""
}




// Emit current data on connection
io.on('connection', function(socket) {
    socket.emit('data', { graph: elements });
});

