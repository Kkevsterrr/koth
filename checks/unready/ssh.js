var SSH = require('simple-ssh');
var CheckPort = require('./checkport');

function CheckSSH(node, options) {
  this.ip = node["data"]["ip"];
  this.checkport = new CheckPort(node, options);
  this.scorebot_username = options["scorebot_username"]
  this.scorebot_password = options["scorebot_password"]
  this.name = "CheckSSH";
  this.status = "open";
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
    me = this;
    return new Promise(function (fulfill, reject) {
        CheckPort.check().then(function (res) {
            if(res.status == "closed") {
                me.status = "closed";
                fulfill(me);
            } else {
                ssh.exec('echo $PATH', {
                    out: function(stdout) {
                        me.status = "open";
                        fulfill(me);
                        //console.log(stdout);
                    }
                }).start();
                ssh.on('error', function(err) {
                    me.status = "issue";
                    fulfill(me)
                    console.log('SSH Check failed for node .');
                    //console.log(err);
                    ssh.end();
                });
            }
        }, function (error) {
            me.status = "closed";
            fulfill(me);
        });
    });
};

module.exports = CheckSSH;
