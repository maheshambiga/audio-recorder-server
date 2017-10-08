import express from 'express';

import uuidv4 from 'uuid/v4'; //random
import { generateToken, sendToken, verifyToken } from './../app/token';
import { getCurrentUser, pushStories } from './../mongo/controllers/index';
import User from '../mongo/models/user';

import * as auth from './../config/authConstants';
import {getGoogleProfile,getFacebookProfile} from './fetchSocialProfile';
const router = express.Router();

router.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('invalid token.');
  }
});

router.get('/health-check', function (req, res) {
  res.status(200);
  res.send('Hello World');
});

const socialSingUp = ({type, id, name, email, imageUrl}) => {
  return new Promise((resolve, reject) => {
    User.findOne({id, authType:type}, (err, user) => {
      if (err) {
        reject({
          statusCOde: 500,
          res: err,
        });
      }

      if (!user) {
        // if the user is not in the database, create a new user
        let newUser = new User();

        // set all of the relevant information
        newUser.id = id;
        newUser.name = name;
        newUser.email = email; // pull the first email
        newUser.picture = imageUrl;
        newUser.authType = type;
        // save the user and send token back
        newUser.save(function (err, currUser) {

          if (err) {
            reject({
              statusCOde: 500,
              res: err,
            });
          } else {
            resolve({
              statusCOde: 200,
              res: {
                'success': true,
                'message': 'User successfully registered.',
              },
            });

          }

        });
      } else {
        resolve({
          statusCOde: 200,
          res: {'success': true, 'message': 'User is already registered.'},
        });

      }
    });
  });

};

const localSingUp = ({type, email, password, name, imageUrl}) => {
  return new Promise((resolve, reject) => {
    User.findOne({email, authType:type}, function (err, user) {
      if (err) {
        reject({
          statusCOde: 500,
          res: err,
        });
      }

      if (user) {
        resolve({
          statusCOde: 200,
          res: {'success': false, 'message': 'That email is already taken.'},
        });

      } else {

        // if there is no user with that email
        // create the user
        let newUser = new User();

        // set the user's local credentials
        newUser.name = name;
        newUser.id = uuidv4();
        newUser.email = email;
        newUser.password = newUser.generateHash(password);
        newUser.picture = imageUrl;
        newUser.authType = type;
        // save the user
        newUser.save(function (err) {
          if (err) {
            resolve({
              statusCOde: 401,
              res: err,
            });

          } else {
            resolve({
              statusCOde: 200,
              res: {
                'success': true,
                'message': 'User successfully registered.',
              },
            });

          }
        });
      }
    });
  });
};

router.post('/signup', (req, res, next) => {

  const type = req.body.type;


  if (type === auth.LOCAL) {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const imageUrl = req.body.imageUrl;

    localSingUp({type, email, password, name, imageUrl}).then((data) => {
      res.status(data.statusCOde).json(data.res);
    }).catch((data) => {
      res.status(data.statusCOde).json(data.res);
    });

  } else {
    const id = req.body.id;
    const name = req.body.name;
    const imageUrl = req.body.imageUrl;
    const email = req.body.email;

    socialSingUp({type, id, name, email, imageUrl}).then((data) => {
      res.status(data.statusCOde).json(data.res);
    }).catch((data) => {
      res.status(data.statusCOde).json(data.res);
    });
  }

});

router.post('/login', (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const type = req.body.type;

  //async
  process.nextTick(() => {
    User.findOne({'email': email, authType:type}, function (err, user) {
      // if there are any errors, return the error before anything else
      if (err)
        res.status(500).send(err);

      // if no user is found, return the message
      if (!user) {
        res.json({'success': false, 'message': 'No user found.'});
        return;
      }

      if(type === auth.LOCAL){
        if (!user.validPassword(password)) {
          // if the user is found but the password is wrong
          res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
        }else{
          req.auth = {
            id: user.id,
          };
          next();
        }
      }else{

        const token = password;
        if(type === auth.GOOGLE){
          getGoogleProfile(token).then((res)=>{
            if(res.data.email === email){
              req.auth = {
                id: user.id,
              };
              next();
            }else{
              res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
            }
          }).catch((err)=>{
            res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
          });
        }else  if(type === auth.FACEBOOK){
          getFacebookProfile(token).then((res)=>{
            if(res.data.email === email){
              req.auth = {
                id: user.id,
              };
              next();
            }else{
              res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
            }
          }).catch((err)=>{
            res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
          });
        }

      }
    });
  });

}, generateToken, sendToken);

router.get('/auth/me', verifyToken, getCurrentUser);

router.post('/upload', verifyToken, pushStories);

export default router;