var client = require('scp2')
var GAME_NAME = "koth2";
var network = __dirname + "/games/" + GAME_NAME + "/test.json";

net = JSON.parse(fs.readFileSync(init, 'utf8'));
for(var i = 0; i < net["nodes"].length; i++) {
    node = net["nodes"][i];
    ip = node["data"]["ip"][0];
    client.scp('claim', {
        host: ip,
        username: 'msfadmin',
        password: 'msfadmin',
        path: '/usr/bin/'
    }, function(err) {})
}
