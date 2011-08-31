var UserStore = require('./user/userstore');
var TokenStore = require('./token/tokenstore');
function AuthorizationService(options) {
  if(!options.realm) {
    throw new Error('Realm is required');
  }
  this.realm = options.realm;
  this.userstore = options.userstore || UserStore;
  this.tokenstore = options.tokenstore || TokenStore;
}
module.exports = AuthorizationService;
AuthorizationService.prototype.register = function register(user, callback) {
  user.key = user.username;
  var self = this;
  return self.userstore.encrypt(user.password, function onEncrypt(err, encryptedPassword) {
    user.password = encryptedPassword;
    return self.userstore.create(user, function onCreateUser(err, user) {
      return callback(err, user);
    });
  });
}
AuthorizationService.prototype.getUser = function getUser(username, callback) {
  return this.userstore.get(username, function onGetUser(err, user) {
    return callback(err, user)
  })
}
AuthorizationService.prototype.delUser = function delUser(username, callback) {
  return this.userstore.destroy(username, callback);
}
AuthorizationService.prototype.verify = function verify(user, callback) {
  var self = this;
  return this.userstore.get(user.username, function onUser(err, saveduser) {
    if(err) {
      return callback(err);
    }
    else {
      return self.userstore.encrypt(user.password, function onEncrypt(err, encryptedPassword) {
        return callback(err, saveduser.password === encryptedPassword);
      });
    }
  });
};
AuthorizationService.prototype.getToken = function getToken(token_id, callback) {
  var self = this;
  this.tokenstore.get(token_id, function(err, token) {
    if(err) {
      callback(err);
    }
    else if(token.maxAge < Date.now()) {
      var error = new Error('Token is expired');
      callback(error);
    }
    else {
      self.getUser(token.username, function onGetUser(err, user) {
        for(var k in token.privileges) {
          if(!user.privileges[k]) {
            var error = new Error('Token does not have original privileges');
            return callback(error);
          }
        }
        return callback(false, token);
      });
    }
  })
}
AuthorizationService.prototype.newToken = function newToken(token, callback) {
  var self = this;
  return this.userstore.get(token.username, function onUser(err, user) {
    console.error('onUser', arguments)
    if(err) {
      return callback(err);
    }
    else {
      for(var k in token.privileges) {
        if(!user.privileges[k]) {
          var error = new Error('User does not have all privileges requested');
          return callback(error);
        }
      }
      return self.tokenstore.create({
        username: token.username,
        maxAge: token.maxAge || (Date.now() + (token.ttl || self.tokenstore.maxTTL)),
        privileges: token.privileges || user.privileges
      }, function onCreateToken(err, token) {
        callback(err, token);
      });
    }
  });
};

AuthorizationService.prototype.delToken = function delToken(token_id) {
  return tokenstore.destroy(token_id, callback);
};
