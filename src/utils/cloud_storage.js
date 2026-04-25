const { Storage } = require('@google-cloud/storage');
const { format } = require('util');
const { v4: uuidv4 } = require('uuid');

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(`${process.env.FIREBASE_PROJECT_ID}.appspot.com`);

/**
 * Subir archivo desde buffer (compatible con Vercel serverless)
 */
const uploadFromBuffer = async (buffer, pathImage, contentType = 'image/png') => {
  if (!pathImage) throw new Error('Path requerido');

  const uuid = uuidv4();
  const fileUpload = bucket.file(pathImage);

  try {
    await fileUpload.save(buffer, {
      resumable: false,
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
    });

    const url = format(
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileUpload.name)}?alt=media&token=${uuid}`,
    );
    console.log('URL DE CLOUD STORAGE', url);
    return url;
  } catch (error) {
    console.error('Error al subir archivo a firebase', error);
    throw new Error('Something is wrong! Unable to upload at the moment.');
  }
};

/**
 * Subir archivo desde req.file (ej: multer) (compatible con Vercel serverless)
 */
const uploadFromFile = async (file, pathImage, contentType = 'image/png') => {
  if (!pathImage) throw new Error('Path requerido');

  const uuid = uuidv4();
  const fileUpload = bucket.file(pathImage);

  try {
    await fileUpload.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuid,
        },
      },
    });

    const url = format(
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileUpload.name)}?alt=media&token=${uuid}`,
    );
    console.log('URL DE CLOUD STORAGE', url);
    return url;
  } catch (error) {
    console.error('Error al subir archivo a firebase', error);
    throw new Error('Something is wrong! Unable to upload at the moment.');
  }
};

module.exports = {
  uploadFromBuffer,
  uploadFromFile,
};
