import User from '../../mongo/models/user';
import multer from 'multer';
import fs from 'fs';

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
  const query = {
    $or: [
      {'google.id': {$regex: id, $options: 'i'}},
      {'facebook.id': {$regex: id, $options: 'i'}},
      {'local.id': {$regex: id, $options: 'i'}}],
  };

  process.nextTick(() => {
    User.findOne({id}, (err, user) => {
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

  User.findOne({id}, (err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {

      const blob = req.body.blob;
      const buf = new Buffer(blob, 'base64'); // decode
      const fileName = `uploads/${Date.now()}_story.wav`;

      fs.writeFile(fileName, buf, (err) => {
        if (err) {
          res.status(500).send(err);
        } else {

          user.stories.push({
            'path': fileName,
            'name': req.body.name,
            'genre': req.body.genre,
          });
          user.save((err, user) => {
            if (err) {
              res.status(500).send(err);
            } else {
              res.json({'success': true, 'message': 'You story is uploaded successfully!'});
            }
          });

        }
      });


    }
  });
};

export const getStories = (req, res) => {
  const id = req.auth.id;



  User.find({}, {_id:0, stories:1}, function (err, docs) {
    if (err) res.status(500).send(err);
    res.json(docs);
  });



};

export const getGenres = (req, res) => {
  const id = req.auth.id;





};