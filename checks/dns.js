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

        req.on('message', function (err, result){
          if (result.answer.reduce((a,b) => {return a || b.address === answer;}, false)) {
            fulfill("open");
          } else {
            fulfill("closed");
          }
        });

        req.send();
    });
};
module.exports = CheckDNS;
