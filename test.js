var fs = require("fs");
var path_module = require('path');
var async = require('async');
var path1 = "./checks";

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
    checks = [];
    ids = [];
    for(check_name in cs) {
        mod = new cs[check_name](node, options);
        ids.push(mod.name);
        checks.push(mod.check());
    }
    async.parallel(checks, function(err, result) {
        stats = {}
        for (i = 0; i < result.length; i++) {
            stats[ids[i]] = result[i];
        }
        console.log(stats)
    });
}).catch(function(err) {
    console.log(err);
    console.log('Failed to import checks: ');
});
