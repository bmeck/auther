var express = require('express');
var AuthorizationService = require('../model/service');
var rest = require('./rest');
var auth = require('./auth');
var util = require('./util');

function WebService(options, callback) {
  var app = this.app = express.createServer();
  app.use(express.bodyParser());
  auth.setupAuthorization(app, options.auth);
  var done = 0;
  var errs = [];
  var admins = options.admins;
  var l = admins.length;
  function next(err) {
    done++;
    if(err) {
      errs.push(err);
    }
    if(done === l) {
      if(callback) callback(errs.length ? errs : false);
    }
  }
  app.admins = {};
  for(var i = 0; i < l; i++) {
    var admin = admins[i];
    app.admins[admin.username] = admin;
    app.auth.register({
      username: admin.username,
      password: admin.password,
      email: admin.email
    }, next)
  }
  rest(app);
}
WebService.prototype.handle = function(req, res, next) {
  var app = this.app;
  app.handle.apply(app, arguments);
}
exports.WebService = WebService;
