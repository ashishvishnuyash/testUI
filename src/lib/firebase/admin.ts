import * as admin from 'firebase-admin';

// Check if Firebase admin has already been initialized
let app: admin.app.App;

export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.apps[0] as admin.app.App;
    return app;
  }

  // Initialize with service account if provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString()
      );
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } catch (error) {
      console.error('Error initializing Firebase Admin with service account:', error);
      throw error;
    }
  } else {
    // Initialize with application default credentials
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }

  return app;
}

// Export Firestore and Auth for convenience
export const getFirestore = () => {
  const app = initializeAdminApp();
  return admin.firestore(app);
};

export const getAuth = () => {
  const app = initializeAdminApp();
  return admin.auth(app);
};