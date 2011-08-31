var http = require('http');
var req = http.IncomingMessage.prototype;
var res = http.ServerResponse.prototype;

req.finish = function finish(status, headers, message) {
  if(message) {
    for(var k in headers) {
      this.res.setHeader(k, headers[k]);
    }
  }
  else {
    if(!message) {
      message = headers;
      headers = undefined;
    }
  }
  this.res.writeHead(status || 200);
  if(typeof message === 'object' && Object.prototype.toString(message) !== '[object Buffer]') {
    this.res.end(JSON.stringify(message));
  }
  else {
    this.res.end(message);
  }
}

req.forbidden = function forbidden() {
  if(this.is('html')) {
    return this.res.finish(403, null, 'Forbidden');
  }
  else {
    return this.res.finish(403, null, {error: 'forbidden'})
  }
}
