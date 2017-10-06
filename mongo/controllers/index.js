import User from '../../mongo/models/user';
import mongoose from 'mongoose';


export const getCurrentUser = (req, res) => {
  const id = req.auth.id;
  const query = {$or:[{'google.id':{$regex: id, $options: 'i'}},{'facebook.id':{$regex: id, $options: 'i'}}, {'local.id':{$regex: id, $options: 'i'}}]};

  process.nextTick(() => {
    User.findOne(mongoose.Types.ObjectId(id)).lean().exec( function (err, user) {
      if (err) {
        res.status(500).send(err);
      } else {
        let filteredRes ;
        if(user.hasOwnProperty('local')){
          filteredRes = user.local;
          delete filteredRes.password;
        }else if(user.hasOwnProperty('google')){
          filteredRes = user.google;
        }else if(user.hasOwnProperty('facebook')){
          filteredRes = user.facebook;
        }
        res.json({'success': true, data: filteredRes});
      }
    });
  });
};