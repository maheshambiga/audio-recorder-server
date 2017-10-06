import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';

const userSchema = mongoose.Schema({

  local: {
    id : String,
    name: String,
    email: String,
    password: String,
    picture: String,

  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String,
    picture: String,

  },

  google: {
    id: String,
    token: String,
    email: String,
    name: String,
    picture: String,

  },
  stories: [{ path: String, name:String }]

},{collection       : 'users'});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// create the model for users and expose it to our app
export default mongoose.model('Users', userSchema);
