var SSH = require('simple-ssh');
var CheckPort = require('./checkport');

function CheckSSH(node, options) {
  this.ip = node["data"]["ip"];
  this.checkport = new CheckPort(node, options);
  this.scorebot_username = options["scorebot_username"]
  this.scorebot_password = options["scorebot_password"]
  this.name = "CheckSSH";
  console.log(this.ip)
  console.log(this.scorebot_username)
  console.log(this.scorebot_password)

  this.ssh = new SSH({
    host: this.ip,
    user: this.scorebot_username,
    pass: this.scorebot_password
  });
}

CheckSSH.prototype.check = function() {
    ssh = this.ssh;
    ip = this.ip;
    CheckPort = this.checkport;
    return new Promise(function (fulfill, reject) {
        CheckPort.check().then(function (res) {
            if(res == "closed") {
                fulfill("closed");
            } else {
                ssh.exec('echo $PATH', {
                    out: function(stdout) {
                        fulfill("open");
                        console.log(stdout);
                    }
                }).start();
                ssh.on('error', function(err) {
                    fulfill("issue")
                    console.log('SSH Check failed for node .');
                    console.log(err);
                    ssh.end();
                });
            }
        }, function (error) {
            fulfill("closed");
        });
    });
};

module.exports = CheckSSH;
