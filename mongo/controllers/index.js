var User = require('../../mongo/models/user');
var multer = require('multer');
var https = require('https');
var fs  = require('fs');
var GoogleCloudStorage = require('./../../GoogleCloudStorage');

const ObjectId = require('mongoose').Types.ObjectId;

const uploadFile = function () {
  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
      cb(null, Date.now() + '_' + file.originalname);
    },
  });

  return multer({storage: storage}).single('my_story');

};

exports.getCurrentUser = function (req, res) {
  const id = req.auth.id;

  process.nextTick(function () {
    User.findOne({'_id': new ObjectId(id)}, function (err, user) {
      if (err) {
        res.status(500).send(err);
      } else {

        res.json({
          'success': true,
          data: {email: user.email, name: user.name, picture: user.picture},
        });
      }
    });
  });
};

exports.pushStories = function (req, res) {
  const id = req.auth.id;

  User.findOne({'_id': new ObjectId(id)}, function (err, user) {
    if (err) {
      res.status(500).send(err);
    } else {

      const blob = req.body.blob;
      const buf = new Buffer(blob, 'base64'); // decode
      const directoryName = 'uploads';
      const fileName = Date.now()+'_story.wav';

      if (!fs.existsSync(directoryName)){
        fs.mkdirSync(directoryName);
      }

      fs.writeFile(directoryName+'/'+fileName, buf, function (err) {
        if (err) {
          res.status(500).send(err);
        } else {
          GoogleCloudStorage.uploadFileToGoogleCloud(directoryName+'/'+fileName).then(function () {
            GoogleCloudStorage.makePublic(fileName).then(function (data) {
              user.stories.push({
                'path': fileName,
                'storyName': req.body.storyName,
                'genre': req.body.genre
              });
              user.save(function (err, user) {
                if (err) {
                  res.status(500).send(err);
                } else {
                  res.json({
                    'success': true,
                    'message': 'You story is uploaded successfully!'
                  });
                }
              });
            }).catch(function (err) {
              res.status(500).send(err);
            });

            fs.unlink(directoryName+'/'+fileName);
          }).catch(function (err) {
            res.status(500).send(err);
          });


        }
      });


    }
  });
};

exports.getGenres = function (req, res) {
  const id = req.auth.id;
  const genre = req.query.genre;

  if (genre === 'all') {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': {'$ne': new ObjectId(id)}}},
      {$project: {createdBy: '$name', picture: '$picture', story: '$stories'}},
      function (err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data: data});
        }
      });
  } else {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': {'$ne': new ObjectId(id)}}},
      {
        $project: {
          createdBy: '$name',
          picture: '$picture',
          story: {
            $filter: {
              input: ['$stories'],
              as: 'story',
              cond: {$eq: ['$$story.genre', genre]},
            },
          },
        },
      }, {$unwind: '$story'}, function (err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data: data});
        }
      });
  }

};

exports.getMyStories = function (req, res) {
  const id = req.auth.id;
  const genre = req.query.genre;

  if (genre === 'all') {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': new ObjectId(id)}},
      {$project: {createdBy: '$name', picture: '$picture', story: '$stories'}},
      function (err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data: data});
        }
      });
  } else {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': new ObjectId(id)}},
      {
        $project: {
          createdBy: '$name',
          picture: '$picture',
          story: {
            $filter: {
              input: ['$stories'],
              as: 'story',
              cond: {$eq: ['$$story.genre', genre]},
            },
          },
        },
      }, {$unwind: '$story'}, function (err, data) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data: data});
        }
      });
  }

};

exports.getOneStory = function (req, res) {
  const id = req.auth.id;
  const storyId = req.query.storyId;
  const userId = req.query.userId;

  User.aggregate(
    {$unwind: '$stories'},
    {$match: {'_id': {'$eq': new ObjectId(userId)}}},
    {
      $project: {
        createdBy: '$name',
        picture: '$picture',
        story: {
          $filter: {
            input: ['$stories'],
            as: 'story',
            cond: {$eq: ['$$story._id', new ObjectId(storyId)]},
          },
        },
      },
    },
    {$unwind: '$story'}, function (err, data) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({'success': true, data: data});
      }
    });

};

exports.deleteStory = function (req, res) {
  const storyId = req.body.storyId;
  const userId = req.body.userId;

  //find story filename
  User.aggregate({$unwind: '$stories'},
    {
      $match: {
        '_id': new ObjectId(userId),
        'stories._id': new ObjectId(storyId),
      },
    },
    {$project: {fileName: '$stories.path'}}, function (err, story) {
      if (err) {
        res.status(500).send(err);
      } else {
        //remove the record from the DB
        User.update({'_id': new ObjectId(userId)},
          {$pull: {'stories': {'_id': new ObjectId(storyId)}}},
          function (err, data) {
            if (err) {
              res.status(500).send(err);
            } else {
              res.json({
                'success': true,
                'message': 'Successfully deleted the story ' + storyId,
              });
              //remove the file from GCS
              GoogleCloudStorage.deleteFileFromGoogleCloud(story[0].fileName).
                then(function (results) {

                  console.log('Successfully deleted the story ' + storyId);
                }).
                catch(function (err) {
                  console.log(err);
                });

            }
          });
      }

    });

};

exports.getStoryAudio = function (req, res) {
  const fileName = req.params.fileName;


  GoogleCloudStorage.readFileFromGoogleCloud(fileName).then(function (data) {
    const url = data[0];


    const externalReq = https.request({
      hostname: 'storage.googleapis.com',
      path: url,
    }, function (externalRes) {

      externalRes.pipe(res);
    });
    externalReq.end();


  });

};
