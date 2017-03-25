var ping = require("net-ping");

function CheckICMP(ip, options) {
  this.ip = ip;
  this.name = "CheckICMP";
}

CheckICMP.prototype.check = function() {
    ip = this.ip;
    CheckPort = this.checkport;
    return function (callback) {
        var session = ping.createSession();
        session.pingHost(ip, function (error, target) {
            if (error) {
                callback (null, "closed");
            } else {
                callback (null, "open");
            }
        });
    };
}
module.exports = CheckICMP;
