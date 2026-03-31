import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, GoogleAuthProvider as GoogleAuthProviderClass, signInWithCredential } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, getDocs, getDocFromServer, Timestamp } from 'firebase/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

// FCM Functions
export const requestNotificationPermissions = async () => {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseMessaging.requestPermissions();
    return result.receive === 'granted';
  }
  return false;
};

export const getFCMToken = async () => {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseMessaging.getToken();
    return result.token;
  }
  return null;
};

export const addNotificationListener = async (callback: (notification: any) => void) => {
  if (Capacitor.isNativePlatform()) {
    await FirebaseMessaging.addListener('notificationReceived', (event) => {
      callback(event.notification);
    });
  }
};

export const loginWithGoogle = async () => {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const credential = GoogleAuthProviderClass.credential(result.credential?.idToken);
    return signInWithCredential(auth, credential);
  } else {
    return signInWithPopup(auth, googleProvider);
  }
};
export const logout = async () => {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signOut();
  }
  return signOut(auth);
};

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore
async function testConnection() {
  try {
    const testRef = doc(db, 'test', 'connection');
    await getDoc(testRef);
    console.log("Firestore connection successful");
  } catch (error) {
    console.log("Firestore connection test skipped or failed:", error instanceof Error ? error.message : String(error));
  }
}
testConnection();

export { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, getDocs, Timestamp };
