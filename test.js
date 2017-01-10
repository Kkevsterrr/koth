var fs = require("fs");
var path_module = require('path');


var path1 = "./checks";
var checks = {};

function import_checks(path) {
   var files = fs.readdirSync(path);
   files.forEach(function(file){
      f = path_module.join(path, file);
      mod = require("./" + f);
      checks[mod.name] = mod;
      console.log(checks);
   });
   fulfill(checks);
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
   node.data.rt = {
      ip:8080
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
