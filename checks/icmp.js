var ping = require("net-ping");

function CheckICMP(node, options) {
  this.ip = node.data.ip;
  this.name = "CheckICMP";
}

CheckICMP.prototype.check = function() {
    ip = this.ip;
    CheckPort = this.checkport;
    return new Promise(function (fulfill, reject) {
        var session = ping.createSession();
        session.pingHost(ip, function (error, target) {
            if (error) {
                fulfill("closed");
            } else {
                fulfill("open");
            }
        });
    });
}
module.exports = CheckICMP;
