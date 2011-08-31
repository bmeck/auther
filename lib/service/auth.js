var AuthorizationService = require('../model/service');
var http = require('http');
var req = http.IncomingMessage.prototype;
req.isAdmin = function isAdmin() {
  return this.auth && this.app.admins[this.auth.user.username];
}
req.isAdminOrUser = function isAdminOrUser(username) {
  return this.isAdmin() || this.isUser(username);
}
req.isUser = function isUser(username) {
  return this.auth && this.auth.user.username === username;
}
req.privileges = function privileges() {
  return (this.auth && this.auth.privileges) || {};
}
req.hasPrivileges = function hasPrivileges(privileges) {
  if(this.isAdmin()) {
    return true;
  }
  var currentPrivileges = this.privileges();
  for(var k in prileges) {
    if(!currentPrivileges[k]) {
      return false;
    }
  }
  return true;
}

function setupAuthorization(app, options) {
  options = options || {};
  app.auth = new AuthorizationService(options.service);
  app.use(function authorize(req, res, next) {
    if(options.remoteAdmin === false) {
      req.isAdmin = function isAdmin() {
        return this.connection.remoteAddress === '127.0.0.1' && this.auth && this.app.admins[this.auth.user.username];
      };
    }
    var authorization = req.headers.authorization || '';
    if(authorization.indexOf('Basic ') === 0) {
      var auth = new Buffer(authorization.slice('Basic '.length), 'base64');
      if(!auth) {
        return next();
      }
      auth = auth.toString().split(':');
      if(auth.length !== 2) {
        return next();
      }
      var username = auth[0];
      var password = auth[1];
      if(!username || !password) {
        return next();
      }
      return app.auth.verify({
        username: username,
        password: password
      }, function onVerify(err, verified) {
        if(verified) {
          return app.auth.getUser(username, function onGetUser(err, user) {
            if(err) {
              return next();
            }
            else {
              req.auth = {
                user: user,
                privileges: user.privileges,
                type: 'login'
              }
              return next();
            }
          });
        }
        else {
          return next();
        }
      })
    }
    else if(req.query['AccessToken']) {
      var token_id = req.query['AccessToken'];
      return app.auth.getToken(token_id, function onGetToken(err, token) {
        if(err) {
          return next();
        }
        else {
          return app.auth.getUser(token.username, function onGetUser(err, user) {
            if(err) {
              return next();
            }
            req.auth = {
              user: user,
              privileges: token.privileges,
              token: token,
              type: 'token'
            }
            return next();
          });
        }
      });
    }
    else {
      return next();
    }
  });
}
exports.setupAuthorization = setupAuthorization;
