var express = require('express');
var uuidv4  = require('uuid/v4'); //random
var token = require('./../app/token');
var routeController = require('./../mongo/controllers/index');
var auth= require('./../config/authConstants');
var fetchSocialProfile = require('./fetchSocialProfile');

var User = require('../mongo/models/user');
var router = express.Router();

router.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('invalid token.');
  }
});

router.get('/health-check', function (req, res) {
  res.status(200);
  res.send('Hello World');
});

const socialSingUp = function(data) {
  return new Promise(function(resolve, reject) {
    User.findOne({id:data.id ,authType:data.type}, function(err, user){
      if (err) {
        reject({
          statusCOde: 500,
          res: err
        });
      }

      if (!user) {
        // if the user is not in the database, create a new user
        var newUser = new User();

        // set all of the relevant information
        newUser.id = data.id;
        newUser.name = data.name;
        newUser.email = data.email; // pull the first email
        newUser.picture = data.imageUrl;
        newUser.authType = data.type;
        // save the user and send token back
        newUser.save(function (err, currUser) {

          if (err) {
            reject({
              statusCOde: 500,
              res: err
            });
          } else {
            resolve({
              statusCOde: 200,
              res: {
                'success': true,
                'message': 'User successfully registered.'
              }
            });

          }

        });
      } else {
        resolve({
          statusCOde: 200,
          res: {'success': true, 'message': 'User is already registered.'}
        });

      }
    });
  });

};

const localSingUp = function(data){
  return new Promise(function(resolve, reject) {
    User.findOne({email:data.email, authType:data.type}, function (err, user) {
      if (err) {
        reject({
          statusCOde: 500,
          res: err
        });
      }

      if (user) {
        resolve({
          statusCOde: 200,
          res: {'success': false, 'message': 'That email is already taken.'}
        });

      } else {

        // if there is no user with that email
        // create the user
        var newUser = new User();

        // set the user's local credentials
        newUser.name = data.name;
        newUser.id = uuidv4();
        newUser.email = data.email;
        newUser.password = newUser.generateHash(data.password);
        newUser.picture = data.imageUrl;
        newUser.authType = data.type;
        // save the user
        newUser.save(function (err) {
          if (err) {
            resolve({
              statusCOde: 401,
              res: err
            });

          } else {
            resolve({
              statusCOde: 200,
              res: {
                'success': true,
                'message': 'User successfully registered.'
              }
            });

          }
        });
      }
    });
  });
};

router.post('/signup', function(req, res, next){

  const type = req.body.type;


  if (type === auth.LOCAL) {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const imageUrl = req.body.imageUrl;

    localSingUp({type:type, email:email, password:password, name:name, imageUrl:imageUrl}).then(function(data){
      res.status(data.statusCOde).json(data.res);
    }).catch(function(data) {
      res.status(data.statusCOde).json(data.res);
    });

  } else {
    const id = req.body.id;
    const name = req.body.name;
    const imageUrl = req.body.imageUrl;
    const email = req.body.email;

    socialSingUp({id:id, type:type, name:name, imageUrl:imageUrl, email:email}).then(function(data) {
      res.status(data.statusCOde).json(data.res);
    }).catch(function(data) {
      res.status(data.statusCOde).json(data.res);
    });
  }

});

router.post('/login', function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const type = req.body.type;

  //async
  process.nextTick(function() {
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
            id: user._id
          };
          next();
        }
      }else{

        const token = password;
        if(type === auth.GOOGLE){
          fetchSocialProfile.getGoogleProfile(token).then(function(res){
            if(res.data.email === email){
              req.auth = {
                id: user._id
              };
              next();
            }else{
              res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
            }
          }).catch(function(err){
            res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
          });
        }else  if(type === auth.FACEBOOK){
          fetchSocialProfile.getFacebookProfile(token).then(function(res){
            if(res.data.email === email){
              req.auth = {
                id: user._id
              };
              next();
            }else{
              res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
            }
          }).catch(function(err){
            res.json({'success': false, 'message': 'Oops! Invalid username or password.'});
          });
        }

      }
    });
  });

}, token.generateToken, token.sendToken);

router.get('/auth/me', token.verifyToken, routeController.getCurrentUser);

router.post('/uploadStory', token.verifyToken, routeController.pushStories);

router.get('/getGenre', token.verifyToken, routeController.getGenres);

router.get('/myStories', token.verifyToken, routeController.getMyStories);

router.get('/story', token.verifyToken, routeController.getOneStory);

router.post('/removeStory', token.verifyToken, routeController.deleteStory);

router.get('/audio/:fileName',  routeController.getStoryAudio);


module.exports = router;