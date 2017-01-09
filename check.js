"use strict";

var fs = require('fs');
var path_module = require('path');
var winston = require('winston');
var as = require('async');


var path1 = './checks';
var checks = null;

var hosts_file = './test_targets';
var hosts = {};

winston.level = 'debug';

function initialize(){
   import_checks(path1);
}

function import_checks(path) {
   checks = {};

   var files = fs.readdirSync(path);
   files.forEach(function(file){
      var f = path_module.join(path, file);
      var mod = require("./" + f);
      checks[mod.name] = mod;
   });
   winston.info(checks.toString());
}

function check_host(host, ip, callback) {
   if(!checks){
      winston.error("Checker used before initialization");
      throw "Checker not initialized";
   }

   var result = {
      name:host.name,
   };

   var global = {
      name:"global",
      checks:host.global
   };

   result.global = check_service(global, ip);

   var calls = [];

   host.services.forEach(function(service){
      calls.append(check_service_factory(service, ip));
   });

   as.parellel(calls, function(err, results){
      result.services = results;
      callback(null, result);
   });
}

function check_service(service, ip){
   var result = {
      name:service.name,
      status:false,
      score:0
   };
   service.checks.forEach(function(check){
      if (checks[check.name].check(ip, check.options)){
         result.score += check.points;
      } else {
         return result;
      }
   });
   result.status = true;
   return result;
}

function check_service_factory(service, ip){
   return function(callback) {
      callback(null, check_service(service, ip));
   };
}

module.initialize = initialize;
module.check_host = check_host;
