const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

/**
 * Garantiza que Firebase esté inicializado antes de usar storage.
 * En Vercel serverless, onModuleInit puede no haber corrido aún.
 */
function ensureFirebaseInitialized() {
  if (!admin.apps.length) {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }
  return admin.storage().bucket();
}

/**
 * Subir archivo desde buffer
 */
const uploadFromBuffer = async (buffer, pathImage, contentType = 'image/png') => {
  if (!pathImage) throw new Error('Path requerido');

  const uuid = uuidv4();
  const bucket = ensureFirebaseInitialized();
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
 * Subir archivo desde req.file (ej: multer)
 */
const uploadFromFile = async (file, pathImage, contentType = 'image/png') => {
  if (!pathImage) throw new Error('Path requerido');

  const uuid = uuidv4();
  const bucket = ensureFirebaseInitialized();
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
