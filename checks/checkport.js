var portscanner = require('portscanner');

function CheckPort(node, options) {
  this.ip = node["data"]["ip"];
  this.port = node["data"]["port"];
  this.name = "CheckPort";
}

CheckPort.prototype.check = function() {
    port = this.port;
    ip = this.ip;
    return new Promise(function (fulfill, reject) {
        try {
            portscanner.checkPortStatus(port, ip, function(error, status) {
                fulfill(status);
            });
        } catch(ex) {
            reject("Error in checking port status");
        }
    });
};

module.exports = CheckPort;
