var Nightmare = require('nightmare');
var nightmare = Nightmare();

function CheckRT(node, options) {
  this.ip = node.data.ip;
  this.port = node.data.rt.port;
  this.name = "CheckRT";
}

CheckRT.prototype.check = function() {
    ip = this.ip;
    return new Promise(function (fulfill, reject) {
      console.log("starting");
      nightmare
          .goto('http:10.1.1.16:8080')
          .type("[name='user']", 'scorebot')
          .type("[name='pass']", 'scorebot')
          .click('.button')
          .wait('#new')
          .end()
          .then(function(result){
             console.log(result);
             fulfill("open");
          })
          .catch(function(error){
             fulfill("closed");
          });
    });
};
module.exports = CheckRT;
