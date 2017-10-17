var User = require('../../mongo/models/user');
var multer = require('multer');
var https = require('https');
var GoogleCloudStorage = require('./../../GoogleCloudStorage');

const ObjectId = require('mongoose').Types.ObjectId;

const uploadFile = function()  {
  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
      cb(null, Date.now() + '_' + file.originalname);
    }
  });

  return multer({storage: storage}).single('my_story');

};

exports.getCurrentUser = function(req, res) {
  const id = req.auth.id;

  process.nextTick(function(){
    User.findOne({'_id': new ObjectId(id)},function(err, user) {
      if (err) {
        res.status(500).send(err);
      } else {


        res.json({'success': true, data: {email:user.email, name:user.name, picture:user.picture}});
      }
    });
  });
};

exports.pushStories = function(req, res) {
  const id = req.auth.id;

  User.findOne({'_id':new ObjectId(id)}, function(err, user){
    if (err) {
      res.status(500).send(err);
    } else {

      const blob = req.body.blob;

  GoogleCloudStorage.uploadFileToGoogleCloud(blob).then(function(data){
        user.stories.push({
          'path': data.fileName,
          'storyName': req.body.storyName,
          'genre': req.body.genre
        });
        user.save(function(err, user) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json({
              'success': true,
              'message': 'You story is uploaded successfully!'
            });
          }
        });

      }).catch(function(err){
        res.status(500).send(err);
      });

    }
  });
};

exports.getGenres = function(req, res) {
  const id = req.auth.id;
  const genre = req.query.genre;

  if (genre === 'all') {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': {'$ne': new ObjectId(id)}}},
      {$project: {createdBy: '$name', story: '$stories'}}, function(err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data:data});
        }
      });
  } else {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': {'$ne': new ObjectId(id)}}},
      {
        $project: {
          createdBy: '$name',
          story: {
            $filter: {
              input: ['$stories'],
              as: 'story',
              cond: {$eq: ['$$story.genre', genre]}
            }
          }
        }
      }, {$unwind: '$story'}, function(err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data:data});
        }
      });
  }

};

exports.getMyStories = function(req, res) {
  const id = req.auth.id;
  const genre = req.query.genre;

  if (genre === 'all') {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': new ObjectId(id)}},
      {$project: {createdBy: '$name', story: '$stories'}}, function(err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data:data});
        }
      });
  } else {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': new ObjectId(id)}},
      {
        $project: {
          createdBy: '$name',
          story: {
            $filter: {
              input: ['$stories'],
              as: 'story',
              cond: {$eq: ['$$story.genre', genre]}
            }
          }
        }
      }, {$unwind: '$story'}, function(err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data:data});
        }
      });
  }

};

exports.getOneStory = function(req, res) {
  const id = req.auth.id;
  const storyId = req.query.storyId;
  const userId = req.query.userId;

  User.aggregate(
    {$unwind: '$stories'},
    {$match: {'_id': {'$eq': new ObjectId(userId)}}},
    {
      $project: {
        createdBy: '$name',
        story: {
          $filter: {
            input: ['$stories'],
            as: 'story',
            cond: {$eq: ['$$story._id', new ObjectId(storyId)]}
          }
        }
      }
    },
    {$unwind: '$story'}, function(err, data) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({'success': true, data:data});
      }
    });

};

exports.getStoryAudio = function (req, res) {
  const fileName = req.params.fileName;

  GoogleCloudStorage.readFileFromGoogleCloud(fileName).then(function(results){
    const url = results[0];

    const externalReq = https.request({
      hostname: "storage.googleapis.com",
      path: url
    }, function(externalRes) {

      externalRes.pipe(res);
    });
    externalReq.end();

  });

};