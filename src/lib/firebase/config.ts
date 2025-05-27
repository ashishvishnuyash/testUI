
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";

// Use NEXT_PUBLIC_ prefixed variables for client-side access
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize as null
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initializationError: string | null = null;

console.log("--- Firebase Config Module Execution Start ---");

// Prepare config object for logging (mask API key)
const configForLogging = {
    apiKey: firebaseConfig.apiKey ? '***' : 'MISSING', // Mask API key
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING_OPTIONAL',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING_OPTIONAL',
    appId: firebaseConfig.appId || 'MISSING_OPTIONAL',
    measurementId: firebaseConfig.measurementId || 'MISSING_OPTIONAL',
};
console.log("[Firebase Config] Loaded config from environment:", JSON.stringify(configForLogging, null, 2));

// Validate essential configuration keys directly
const requiredKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
    initializationError = `Missing required environment variables: ${missingKeys.join(', ')}. Firebase services (Auth, Firestore) will be unavailable. Check your .env.local file and ensure variables start with NEXT_PUBLIC_`;
    console.error(`🔴 [Firebase Config] ERROR: ${initializationError}`);
    // Keep app, auth, db as null
} else {
    console.log("🟢 [Firebase Config] All essential config variables (apiKey, authDomain, projectId) are present in environment.");

    try {
        // Attempt to get or initialize the Firebase App
        if (!getApps().length) {
            console.log("[Firebase Init] No existing app found. Attempting to initialize a new app...");
            app = initializeApp(firebaseConfig);
            console.log(`🟢 [Firebase Init] New Firebase app initialized successfully. Name: ${app.name}`);
        } else {
            console.log("[Firebase Init] Getting the existing default Firebase app instance.");
            app = getApp(); // Use the default app
            console.log(`🔵 [Firebase Init] Using existing Firebase app instance. Name: ${app.name}`);
        }

        // === Crucial Verification Step ===
        // Verify that the initialized/retrieved app object actually contains the necessary config.
        if (app && app.options && app.options.apiKey && app.options.authDomain && app.options.projectId) {
            console.log("🟢 [Firebase Verification] The initialized/retrieved Firebase App object contains essential config options (apiKey, authDomain, projectId).");

            // Proceed to get services ONLY if app is valid
            try {
                console.log("[Firebase Services] Attempting to get Auth service...");
                auth = getAuth(app);
                console.log("🟢 [Firebase Services] Auth service obtained successfully.");

                // Example for connecting to emulator (only in development)
                // if (process.env.NODE_ENV === 'development' && !auth.emulatorConfig) {
                //    console.log("Connecting to Auth Emulator...");
                //    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
                // }

            } catch (authError: any) {
                initializationError = `Error getting Firebase Auth service: ${authError.message || authError}`;
                console.error(`🔴 [Firebase Services] ${initializationError}`, authError);
                auth = null; // Ensure auth is null on error
            }

            try {
                console.log("[Firebase Services] Attempting to get Firestore service...");
                db = getFirestore(app);
                console.log("🟢 [Firebase Services] Firestore service obtained successfully.");

                 // Example for connecting to emulator (only in development)
                // if (process.env.NODE_ENV === 'development') {
                //     try {
                //         console.log("Attempting to connect to Firestore Emulator...");
                //         // Check if already connected might be needed depending on HMR behavior
                //         connectFirestoreEmulator(db, 'localhost', 8080);
                //         console.log("🟢 Connected to Firestore Emulator.");
                //     } catch (emulatorError: any) {
                //          if (emulatorError.code === 'failed-precondition') {
                //             console.warn("Firestore emulator already connected or connection failed.");
                //          } else {
                //             console.error("🔴 Error connecting to Firestore Emulator:", emulatorError);
                //          }
                //     }
                // }


            } catch (dbError: any) {
                initializationError = `Error getting Firebase Firestore service: ${dbError.message || dbError}`;
                console.error(`🔴 [Firebase Services] ${initializationError}`, dbError);
                db = null; // Ensure db is null on error
            }

        } else {
             initializationError = "CRITICAL ERROR: The Firebase App object (app or app.options) is missing essential configuration details (apiKey, authDomain, or projectId) AFTER initialization/retrieval. This is likely the cause of 'auth/configuration-not-found'. Check the config values passed to initializeApp.";
             console.error(`🔴 [Firebase Verification] ${initializationError}`);
             const appOptionsForLogging = app?.options ? {
                    apiKey: app.options.apiKey ? '***' : 'MISSING_IN_APP_OBJECT',
                    authDomain: app.options.authDomain || 'MISSING_IN_APP_OBJECT',
                    projectId: app.options.projectId || 'MISSING_IN_APP_OBJECT',
                } : { options: 'MISSING_ON_APP_OBJECT'};
            console.error("[Firebase Verification] App object options found:", JSON.stringify(appOptionsForLogging));
            app = null; // Invalidate app
            auth = null;
            db = null;
        }

    } catch (initError: any) {
        initializationError = `Top-Level Initialization/Retrieval Error: ${initError.message || initError}. This likely means the initial config from environment variables was invalid.`;
        console.error(`🔴 [Firebase Init] ${initializationError}`, initError);
        app = null;
        auth = null;
        db = null;
    }
}

// Log final state before export
console.log(`[Firebase Export] Status: ${initializationError ? `🔴 Error: ${initializationError}` : '🟢 Success'}`);
console.log(`[Firebase Export] Exporting services: App=${app ? `OK (${app.name})` : 'NULL'}, Auth=${auth ? 'OK' : 'NULL'}, DB=${db ? 'OK' : 'NULL'}`);
console.log("--- Firebase Config Module Execution End ---");

// Export potentially null values; components using them MUST handle null checks
export { app, auth, db, initializationError };
