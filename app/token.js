var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var config = require('./../config/config');

var createToken = function(auth) {
  return jwt.sign({
      id: auth.id
    }, config.tokenSecret,
    {
      expiresIn: 60 * 120
    });
};

exports.generateToken =  function(req, res, next)  {
  req.token = createToken(req.auth);
  next();
};

exports.sendToken =  function(req, res) {
  res.setHeader('x-auth-token', req.token);
  res.json({'success':true, 'message':'Token generated.', 'data':req.auth});
};

exports.verifyToken = expressJwt({
  secret: config.tokenSecret,
  requestProperty: 'auth',
  getToken: function(req) {
    if (req.headers['x-auth-token']) {
      return req.headers['x-auth-token'];
    }
    return null;
  }
});
