import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import config from './../config/config';

const createToken = (auth)=> {
  return jwt.sign({
      id: auth.id
    }, config.tokenSecret,
    {
      expiresIn: 60 * 120
    });
};

export const generateToken =  (req, res, next) => {
  req.token = createToken(req.auth);
  next();
};

export const sendToken =  (req, res) => {
  res.setHeader('x-auth-token', req.token);
  res.json({'success':true, 'message':'Token generated.', 'data':req.auth});
};

export const verifyToken = expressJwt({
  secret: config.tokenSecret,
  requestProperty: 'auth',
  getToken: function(req) {
    if (req.headers['x-auth-token']) {
      return req.headers['x-auth-token'];
    }
    return null;
  }
});
