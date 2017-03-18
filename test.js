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
                if (fs.lstatSync(f).isFile()) {
                    mod = require("./" + f);
                    checks[mod.name] = mod
                }
            }
            console.log(checks);
            fulfill(checks);
        });
    });
}

import_checks(path1).then(function (cs) {
    var node = {};
    node["data"] = {};
    node["data"]["ip"] = "127.0.0.1";
    node["data"]["port"] = 22;
    node["data"]["dns"] = {
      "question": {
        "name": "mail.aces.local",
        "type": "A"
      },
      "answer": "10.10.10.13"
    }
    var options = {};
    options["scorebot_username"] = "scorebot";
    options["scorebot_password"] = "password";
    promises = [];
    console.log("====Starting Checks====");
    for(check_name in cs) {
        mod = new cs[check_name](node, options);
        console.log(mod.name);
        promises.push(mod.check());
    }
    console.log(promises);
    Promise.all(promises).then(function(res) {
        console.log("====Collecting Results====");
        console.log(promises[0].name == promises[1].name)
        console.log(promises);
        //process.stdout.write("Checking " + res.name + ": ")
        console.log(res)
    }, function (error) {
        console.log(error.stack)
        console.error('uh oh: ', error);
    });

}, function (error) {
    console.log('Failed to import checks: ', error);
});
