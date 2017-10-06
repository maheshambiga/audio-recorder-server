import mongoose from 'mongoose';


const storySchema = mongoose.Schema({

  id : String,
  path: String,


},{collection       : 'stories'});


// create the model for users and expose it to our app
export default mongoose.model('Story', userSchema);
