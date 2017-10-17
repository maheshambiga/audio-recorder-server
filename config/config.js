import bluebird from 'bluebird';

const dbConnection = {
  'url' : 'mongodb://mahesh.ambig:storytelling123@ds119355.mlab.com:19355/story-telling',
  'tokenSecret': 'ulalaulala',
  'options':{
    'promiseLibrary': bluebird
  }
};
export default dbConnection;