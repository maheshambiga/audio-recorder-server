import User from '../../mongo/models/user';
import multer from 'multer';

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
      const storage = multer.diskStorage({
        destination: 'uploads/',
        filename: function (req, file, cb) {
          cb(null, Date.now() + '_' + file.originalname);
        },
      });

      const  uploadFile = multer({storage: storage}).single('my_story');
      uploadFile(req, res, function (err, file) {
        if (err) {
          res.status(500).send(err);

        } else {
          user.stories.push({
            'path': res.req.file.path,
            'name': req.body.name,
            'genre': req.body.genre,
          });
          user.save((err, user) => {
            if (err) {
              res.status(500).send(err);
            } else {
              res.json({'success': true, 'message': 'Success!'});
            }
          });
        }

      });

    }
  });
};