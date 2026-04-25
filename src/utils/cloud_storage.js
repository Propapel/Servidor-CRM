const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

/**
 * Subir archivo desde buffer usando Firebase Admin SDK (compatible con Vercel serverless)
 */
const uploadFromBuffer = async (buffer, pathImage, contentType = 'image/png') => {
  if (!pathImage) throw new Error('Path requerido');

  const uuid = uuidv4();
  const bucket = admin.storage().bucket();
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

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(pathImage)}?alt=media&token=${uuid}`;
    console.log('URL DE CLOUD STORAGE', url);
    return url;
  } catch (error) {
    console.error('Error al subir archivo a firebase', error);
    throw new Error('Something is wrong! Unable to upload at the moment.');
  }
};

/**
 * Subir archivo desde req.file (ej: multer) usando Firebase Admin SDK
 */
const uploadFromFile = async (file, pathImage, contentType = 'image/png') => {
  if (!pathImage) throw new Error('Path requerido');

  const uuid = uuidv4();
  const bucket = admin.storage().bucket();
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

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(pathImage)}?alt=media&token=${uuid}`;
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
