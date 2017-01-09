var CheckSSH = require("./checks/ssh");
var CheckICMP = require('./checks/icmp');
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
    node["data"] = {};
    node["data"]["ip"] = "127.0.0.1";
    node["data"]["port"] = 22;
    var options = {};
    options["scorebot_username"] = "scorebot";
    options["scorebot_password"] = "password";
    console.log(cs);
    for(check_name in cs) {
        console.log(check_name);
        mod = new cs[check_name](node, options);
        console.log(mod);
        mod.check().then(function(res) { // TODO - BY THE TIME THE PROMISE COMPLETES< CHECK_NAME IS SSH, SO NEED TO RETURN THE NAME OF THE CHECK TOO!!
            process.stdout.write("Checking " + check_name + ": ")
            console.log(res)
        }, function (error) {
            console.log(error.stack)
            console.error('uh oh: ', error);   // 'uh oh: something bad happened’
        });
    }

}, function (error) {
    console.log('Failed to import checks: ', error);
});
