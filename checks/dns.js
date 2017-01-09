"use strict";

var dns = require('native-dns');

function CheckDNS(node, options) {
  this.ip = node.data.ip;
  this.question = node.data.dns.question;
  this.answer = node.data.dns.answer;
  this.name = "CheckDNS";
}

CheckDNS.prototype.check = function() {
    var ip = this.ip;
    var question = dns.Question(this.question);
    var answer = this.answer;
    return new Promise(function (fulfill, reject) {
        var req = dns.Request({
          question: question,
          server: { address: ip, port: 53, type: 'udp' },
          timeout: 1000,
          cache: false,
        });

        req.on('timeout', function(){
          fulfill("timeout");
        });

        req.on('message', function (err, answer){
          console.log(answer);
          if (answer.answer.reduce((a,b) => {console.log(b.address); a || b.address === answer;}, false)) {
            fulfill("open");
          } else {
            fulfill("closed");
          }
        });

        req.send();
    });
};
module.exports = CheckDNS;
