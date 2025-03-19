import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import * as serviceAccount from '../../coderfolks-images-firebase-adminsdk-fs3b0-61abbfcf19.json';
dotenv.config();

// console.log("Service :: ", serviceAccount);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});


export const db = admin.firestore();
export const bucket = admin.storage().bucket();
db.settings({ databaseId: 'cache-metadata' });
// console.log("Firebase Initialized: ", db);

const testFirestoreConnection = async () => {
    try {
        const testDocRef = db.collection("system").doc("connection-test");
        await testDocRef.set({
            lastChecked: admin.firestore.FieldValue.serverTimestamp(),
            status: 'ok'
        });
        console.log("✅ Firestore connection successful");
    } catch (error) {
        console.error("❌ Firestore connection error:", error);
    }
};

const testStorageConnection = async () => {
    try {
        // Just check if we can list files (this won't create anything)
        const [files] = await bucket.getFiles({ maxResults: 1 });
        console.log(`✅ Storage connection successful, bucket: ${bucket.name}`);
    } catch (error) {
        console.error(`❌ Storage connection error for bucket ${bucket.name}:`, error);
    }
};

Promise.all([
    testFirestoreConnection(),
    testStorageConnection()
]).catch(err => console.error("Connection tests failed:", err));