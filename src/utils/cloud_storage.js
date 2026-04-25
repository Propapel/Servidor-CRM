const { Storage } = require('@google-cloud/storage');
const { format } = require('util');
const { v4: uuidv4 } = require('uuid');
const uuid = uuidv4();

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(`gs://${process.env.FIREBASE_PROJECT_ID}.appspot.com/`);

/**
 * Subir archivo desde buffer
 */
const uploadFromBuffer = (buffer, pathImage, contentType = 'image/png') => {
  return new Promise((resolve, reject) => {
    if (!pathImage) return reject("Path requerido");

    let fileUpload = bucket.file(`${pathImage}`);
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        }
      },
      resumable: false
    });

    blobStream.on('error', (error) => {
      console.error('Error al subir archivo a firebase', error);
      reject('Something is wrong! Unable to upload at the moment.');
    });

    blobStream.on('finish', () => {
      const url = format(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUpload.name}?alt=media&token=${uuid}`);
      console.log('URL DE CLOUD STORAGE ', url);
      resolve(url);
    });

    blobStream.end(buffer);
  });
};

/**
 * Subir archivo desde req.file (ej: multer)
 */
const uploadFromFile = (file, pathImage, contentType = 'image/png') => {
  return new Promise((resolve, reject) => {
    if (!pathImage) return reject("Path requerido");

    let fileUpload = bucket.file(`${pathImage}`);
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        }
      },
      resumable: false
    });

    blobStream.on('error', (error) => {
      console.error('Error al subir archivo a firebase', error);
      reject('Something is wrong! Unable to upload at the moment.');
    });

    blobStream.on('finish', () => {
      const url = format(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUpload.name}?alt=media&token=${uuid}`);
      console.log('URL DE CLOUD STORAGE ', url);
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
};

// Exportar ambas
module.exports = {
  uploadFromBuffer,
  uploadFromFile
};
