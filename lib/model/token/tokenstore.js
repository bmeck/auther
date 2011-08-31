var resourcer = require('resourcer');

var TokenStore = resourcer.define('token');
module.exports = TokenStore;

TokenStore.property('username').minLength(7);
TokenStore.property('maxAge', Number);
TokenStore.property('privileges', Object, {
  default: {}
});
TokenStore.property('data', Object, {
  default: {}
});
TokenStore.maxTTL = 1000 * 60 * 60 * 24 * 365;
