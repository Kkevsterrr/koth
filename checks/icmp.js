var ping = require("net-ping");

function CheckICMP(node, options) {
  this.ip = node["data"]["ip"];
  this.name = "CheckICMP";
  this.status = "open";
}

CheckICMP.prototype.check = function() {
    ip = this.ip;
    CheckPort = this.checkport;
    me = this;
    return new Promise(function (fulfill, reject) {
        var session = ping.createSession();
        session.pingHost(ip, function (error, target) {
            if (error) {
                me.status = "closed";
                fulfill(me);
            } else {
                me.status = "open";
                fulfill(me);
            }
        });
    });
}
module.exports = CheckICMP;
