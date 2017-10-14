const Storage = require('@google-cloud/storage');
const projectId = 'story-telling-app-bfe0b';

const storage = Storage({
  projectId: projectId,
  keyFilename: 'story-telling-app-561c725eca53.json',
});

const bucketName = 'story_audios_bucket';

const bucket = storage.bucket(bucketName);

bucket.exists().then((data) => {
  const exists = data[0];

  if(!exists)storage.createBucket(bucketName, (err, bucket, apiResponse) => {
    if (err) {
      return console.log('ERROR:', err);
    }
    console.log(`Bucket '${bucket}' created.`);
  });
});

export const uploadFileToGoogleCloud = (blob) => {

  const buf = new Buffer(blob, 'base64'); // decode

  const fileName = `${Date.now()}_story.wav`;

  const bucket = storage.bucket(bucketName);

  const gcpBlob = bucket.file(fileName);

  const blobStream = gcpBlob.createWriteStream({
    metadata: {
      contentType: 'audio/wav',
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', function (err) {
      reject(err);
    }).on('finish', function (data) {
      resolve(
        {'fileName': fileName});
    });

    blobStream.end(buf);
  });
};

export const readFileFromGoogleCloud = (fileName)=> {
  //TODO-check for a better approach to read files from GCS
  const options = {
    action: 'read',
    expires: '11-20-2020',
  };

  return storage.bucket(bucketName)
  .file(fileName)
  .getSignedUrl(options);
};