
function RESTService(app) {
  app.use(function log(req, res, next) {
    console.log(new Date,req.method,req.url);
    next();
  })
  app.get('/token/:tokenid', function getToken(req, res, next) {
    app.auth.getToken(req.params.tokenid, function(err, token) {
      req.finish(err ? err.code || 500 : 200, null, err ? err.message : token);
    })
  });
  //Must be an admin or the token itself
  app.del('/token/:tokenid', function deleteToken(req, res, next) {
    function ok() {
      app.auth.delToken(tokenid, function onDeleteToken(err) {
        var status = err ? err.code || 500 : 200;
        if(req.is('html')) {
          req.finish(status);
        }
        else {
          req.finish(status, null, {error: err.message});
        }
      })
    }
    var tokenid = req.params.tokenid;
    
    if(req.isAdmin()) {
      return ok();
    }
    return app.auth.getToken(tokenid, function onGetToken(err, token) {
      if(req.isUser(token.username) && req.auth.token && req.auth.token._id === tokenid) {
        return ok();
      }
      else {
        return req.forbidden();
      }
    })
  })
  //Must be the user or admin
  app.post('/token', function createToken(req, res, next) {
    if(!req.auth) {
      return req.finish(401, {"WWW-Authenticate": 'Basic realm='+JSON.stringify(String(app.auth.realm))}, '"Login Required"');
    }
    if(req.auth.type === 'token') {
      return req.finish(401, {"WWW-Authenticate": 'Basic realm='+JSON.stringify(String(app.auth.realm))}, '"Cannot use token access for this"');
    }
    var body = req.body || {};
    return app.auth.newToken({
        maxAge: Math.min(app.auth.tokenstore.maxTTL, body.ttl) + Date.now(),
        username: body.username && req.isAdmin() ? body.username : req.auth.user.username,
        privileges: body.privileges
      }, function onCreateToken(err, token) {
        console.dir(arguments);
        if(err) {
          req.finish(err.code || 500);
        }
        else {
          req.finish(201, null, token);
        }
      });
  });
  app.get('/user/:id', function getUser(req, res, next) {
    if(req.isAdminOrUser(req.params.id)) {
      return app.auth.getUser(req.params.id, function onGetUser(err, user) {
        if(err) {
          return req.finish(err.code || 500);
        }
        else {
          return req.finish(200, null, {
            username: user.username,
            privileges: user.privileges
          });
        }
      });
    }
    else {
      return req.forbidden();
    }
  });
  app.post('/user/:username', function createUser(req, res, next) {
    if(req.isAdmin(req.auth)) {
      var body = req.body;
      return app.auth.register({
          username: req.params.username,
          privilges: body.privileges,
          password: body.password,
          email: body.email
        }, function onRegister(err, user) {
        if(err) {
          req.finish(err.code || 400, err.message);
        }
        else {
          req.finish(201, null, {
            username: user.username,
            privileges: user.privileges
          });
        }
      });
    }
    else {
      return req.forbidden();
    }
  });
}
module.exports = RESTService;
