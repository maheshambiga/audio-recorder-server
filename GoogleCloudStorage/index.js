const Storage = require('@google-cloud/storage');
const projectId = 'story-telling-app-bfe0b';

const storage = Storage({
  projectId: projectId,
  keyFilename: 'story-telling-app-561c725eca53.json'
});

const bucketName = 'story_audios_bucket';

const bucket = storage.bucket(bucketName);

bucket.exists().then(function (data) {
  const exists = data[0];

  if (!exists) storage.createBucket(bucketName,
    function (err, bucket, apiResponse) {
      if (err) {
        return console.log('ERROR:', err);
      }
      console.log('Bucket created.');
    });
});

exports.uploadFileToGoogleCloud = function (blob) {

  const buf = new Buffer(blob, 'base64'); // decode

  const fileName = Date.now() + '_story.wav';

  const bucket = storage.bucket(bucketName);

  const gcpBlob = bucket.file(fileName);

  const blobStream = gcpBlob.createWriteStream({
    metadata: {
      contentType: 'audio/wav'
    }
  });

  return new Promise(function (resolve, reject) {
    blobStream.on('error', function (err) {
      reject(err);
    }).on('finish', function (data) {
      resolve(
        {'fileName': fileName});
    });

    blobStream.end(buf);
  });
};

exports.readFileFromGoogleCloud = function (fileName) {
  //TODO-check for a better approach to read files from GCS
  const options = {
    action: 'read',
    expires: '11-20-2020'
  };

  return storage.bucket(bucketName).file(fileName).getSignedUrl(options);
};

exports.deleteFileFromGoogleCloud = function (fileName) {
  return storage.bucket(bucketName).file(fileName).delete();
};