import User from '../../mongo/models/user';
import multer from 'multer';
import https from 'https';
import {uploadFileToGoogleCloud, readFileFromGoogleCloud} from './../../GoogleCloudStorage';
const ObjectId = require('mongoose').Types.ObjectId;

const uploadFile = () => {
  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
      cb(null, Date.now() + '_' + file.originalname);
    },
  });

  return multer({storage: storage}).single('my_story');

};

export const getCurrentUser = (req, res) => {
  const id = req.auth.id;

  process.nextTick(() => {
    User.findOne({'_id': new ObjectId(id)}, (err, user) => {
      if (err) {
        res.status(500).send(err);
      } else {
        const {email, name, picture} = user;

        res.json({'success': true, data: {email, name, picture}});
      }
    });
  });
};

export const pushStories = (req, res) => {
  const id = req.auth.id;

  User.findOne({'_id':new ObjectId(id)}, (err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {

      const blob = req.body.blob;

      uploadFileToGoogleCloud(blob).then((data)=>{
        user.stories.push({
          'path': data.fileName,
          'storyName': req.body.storyName,
          'genre': req.body.genre,
        });
        user.save((err, user) => {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json({
              'success': true,
              'message': 'You story is uploaded successfully!'
            });
          }
        });

      }).catch((err)=>{
        res.status(500).send(err);
      });

    }
  });
};

export const getGenres = (req, res) => {
  const id = req.auth.id;
  const genre = req.query.genre;

  if (genre === 'all') {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': {'$ne': new ObjectId(id)}}},
      {$project: {createdBy: '$name', story: '$stories'}}, (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data});
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
              cond: {$eq: ['$$story.genre', genre]},
            },
          },
        },
      }, {$unwind: '$story'}, (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data});
        }
      });
  }

};

export const getMyStories = (req, res) => {
  const id = req.auth.id;
  const genre = req.query.genre;

  if (genre === 'all') {
    User.aggregate(
      {$unwind: '$stories'},
      {$match: {'_id': new ObjectId(id)}},
      {$project: {createdBy: '$name', story: '$stories'}}, (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data});
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
              cond: {$eq: ['$$story.genre', genre]},
            },
          },
        },
      }, {$unwind: '$story'}, (err, data) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.json({'success': true, data});
        }
      });
  }

};

export const getOneStory = (req, res) => {
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
            cond: {$eq: ['$$story._id', new ObjectId(storyId)]},
          },
        },
      },
    },
    {$unwind: '$story'}, (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json({'success': true, data});
      }
    });

};

export const getStoryAudio = (req, res) => {
  const fileName = req.params.fileName;

  readFileFromGoogleCloud(fileName).then((results)=>{
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