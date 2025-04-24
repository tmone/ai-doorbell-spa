import firebase from '@react-native-firebase/app';
// Import for type definitions
import '@react-native-firebase/auth';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAAcbacxH8N7X06p1OKEfoJ1SQXliwT0VA",
  authDomain: "ai-doorbell-bc01e.firebaseapp.com",
  projectId: "ai-doorbell-bc01e",
  storageBucket: "ai-doorbell-bc01e.appspot.com",
  messagingSenderId: "272823192726",
  appId: "1:272823192726:web:798c9c33e03d54680d06b7",
  measurementId: "G-SZ6C81E1CJ",
  databaseURL: "https://ai-doorbell-bc01e.firebaseio.com"
};

// Initialize Firebase with the config
if (!firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed', error);
  }
}

export { firebase };
export default firebaseConfig;