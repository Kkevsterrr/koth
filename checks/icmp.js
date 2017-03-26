'use strict';

var ping = require("net-ping");

function CheckICMP(ip, options) {
  this.ip = ip;
  this.name = "CheckICMP";
}

CheckICMP.prototype.check = function() {
    var ip = this.ip;
    var machine_name = this.machine_name;
    return function (callback) {
        var session = ping.createSession();
        session.pingHost(ip, function (error, target) {
            if (error) {
                callback (null, {"name" : machine_name, "status": "closed"});
            } else {
                callback (null, {"name" : machine_name, "status": "open"});
            }
        });
    };
}
module.exports = CheckICMP;
