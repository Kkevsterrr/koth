var portscanner = require('portscanner');

function CheckPort(machine_name, ip, options) {
  this.machine_name = machine_name;
  this.ip = ip;
  this.port = options["port"];
  this.name = "CheckPort";
}

CheckPort.prototype.check = function() {
    var port = this.port;
    var ip = this.ip;
    var machine_name = this.machine_name;
    return function (callback) {
        try {
            portscanner.checkPortStatus(port, ip, function(error, status) {
                callback (null, {"name" : machine_name, "status": status});
            });
        } catch(ex) {
            callback("Error in checking port status", {"name" : machine_name, "status": "closed"});
        }
    };
};

module.exports = CheckPort;
