var CheckSSH = require("./checks/ssh");
var CheckICMP = require('./checks/icmp');
var CheckDNS = require('./checks/dns');
var fs = require("fs");
var path_module = require('path');


var path1 = "./checks";
var module_holder = {};

function import_checks(path) {
    checks = {}
    return new Promise(function (fulfill, reject) {
        fs.readdir(path, function(err, files) {
            var f, l = files.length;
            for (var i = 0; i < l; i++) {
                f = path_module.join(path, files[i]);
                mod = require("./" + f);
                checks[mod.name] = mod
                console.log(checks);
            }
            fulfill(checks);

        });
    });
}
import_checks(path1).then(function (cs) {
    var node = {};
    node.data = {};
    node.data.ip = "10.1.1.11";
    node.data.port = 22;
    node.data.dns = {
      question: {
        name: "mail.aces.local",
        type: "A"
      },
      answer: "10.10.10.13"
    };
    var options = {};
    options.scorebot_username = "student";
    options.scorebot_password = "student1@";
    console.log(cs);
    for(var check_name in cs) {
        console.log(check_name);
        mod = new cs[check_name](node, options);
        console.log(mod);
        mod.check().then(fulfill_factory(check_name), reject_factory(check_name));
    }

}, function (error) {
    console.log('Failed to import checks: ', error);
});

function fulfill_factory(name){
  return function(res) {
      process.stdout.write("Checking " + name + ": ");
      console.log(res);
  };
}

function reject_factory(name){
  return function (error) {
      console.log(error.stack);
      console.error('uh oh: ', error);   // 'uh oh: something bad happened’
  };
}
