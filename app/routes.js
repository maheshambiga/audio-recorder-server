import express from 'express';

import uuidv4 from 'uuid/v4';//random
import { generateToken, sendToken, verifyToken } from './../app/token';
import { getCurrentUser } from './../mongo/controllers/index';
import User from '../mongo/models/user';
import multer from 'multer';
import mkdirp from 'mkdirp';

import fs from 'fs';
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

router.post('/signupSocial', (req, res, next) => {
  const id = req.body.id;
  const name = req.body.name;
  const imageUrl = req.body.imageUrl;
  const email = req.body.email;
  const type = req.body.type;

  User.findOne({[type + '.id']: id}, (err, user) => {
    if (err) return done(err);

    if (!user) {
      // if the user is not in the database, create a new user
      let newUser = new User();

      // set all of the relevant information
      newUser[type].id = id;
      newUser[type].name = name;
      newUser[type].email = req.body.email; // pull the first email
      newUser[type].picture = imageUrl;

      // save the user and send token back
      newUser.save(function (err, currUser) {

        if (err)
          throw err;


        req.auth = {
          id: currUser._id,
        };

        next();

      });
    }else{
      //if user is already registered, send token back
      req.auth = {
        id: user.id,
      };

      next();
    }
  });
}, generateToken, sendToken);


router.post('/signup', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const imageUrl = req.body.imageUrl;
  //async
  process.nextTick(() => {
    User.findOne({'local.email': email}, function (err, user) {
      if (err) res.status(500).send(err);

      if (user) {
        return res.status(200).
          json({'success':false, 'message': 'That email is already taken.'});
      } else {

        // if there is no user with that email
        // create the user
        let newUser = new User();

        // set the user's local credentials
        newUser.local.name = name;
        newUser.local.id = uuidv4();
        newUser.local.email = email;
        newUser.local.password = newUser.generateHash(password);
        newUser.local.picture = imageUrl;
        // save the user
        newUser.save(function (err) {
          if (err) {
            res.status(401).send(err);
          } else {
            res.json({'success':true, 'message':'User successfully registered.'});
          }
        });
      }
    });
  });

});

router.post('/login', (req, res, next)=>{
  const email = req.body.email;
  const password = req.body.password;

  //async
  process.nextTick(() => {
    User.findOne({ 'local.email':  email }, function (err, user) {
      // if there are any errors, return the error before anything else
      if (err)
        res.status(500).send(err);

      // if no user is found, return the message
      if (!user){
        res.json({'success': false, 'message': 'No user found.'});
      }else if (!user.local.validPassword(password)){
        // if the user is found but the password is wrong
        res.json({'success': false, 'message': 'Oops! Wrong password.'});
      }else{

        req.auth = {
          id: user.id,
        };

        next();
      }

    });
  });

}, generateToken, sendToken);

router.get('/auth/me', verifyToken, getCurrentUser);

router.post('/upload', (req, res, next)=>{
  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
      cb(null, Date.now() + '_' + file.originalname);
    }
  });


  const upload = multer({ storage:storage }).single('my_story');

  upload(req,res,function(err) {
    if(err) {
      res.status(500).send(err);

    }else{
      next();
    }


  });
}, verifyToken);

export default router;