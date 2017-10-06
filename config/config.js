import bluebird from 'bluebird';

const dbConnection = {
  'url' : 'mongodb://localhost:27017/react-native',
  'tokenSecret': 'ulalaulala',
  'options':{
    'promiseLibrary': bluebird
  }
};
export default dbConnection;