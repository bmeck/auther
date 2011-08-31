var resourcer = require('resourcer');
var crypto = require('crypto');

var UserStore = resourcer.define('user');
module.exports = UserStore;
UserStore.property('username').minLength(7);
UserStore.property('password').minLength(7);
UserStore.property('email').pattern(/^[^@]+[@][^@]+$/);

UserStore.property('privileges', Object, {
  default: {}
});

UserStore.encrypt = function(val, callback) {
  var hash = crypto.createHash('sha256');
  hash.update(val);
  callback(false, hash.digest());
}
