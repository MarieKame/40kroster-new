// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, setPersistence, inMemoryPersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, set, onValue } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqrwiROJJX5S3Ojbd4pjRGAlaD2iVNsZw",
  authDomain: "datacards-f0282.firebaseapp.com",
  projectId: "datacards-f0282",
  storageBucket: "datacards-f0282.appspot.com",
  messagingSenderId: "123387708527",
  appId: "1:123387708527:web:0f0fdfc81a47432c65399a",
  measurementId: "G-GNCE8JK9NC",
  databaseURL:"https://datacards-f0282-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage)});
const database = getDatabase(app);

function saveToDatabase(uid, rostersJson) {
  set(ref(database, 'users/' + uid), {
    rostersJson: rostersJson
  });
}

function readFromDatabase(uid, onReadDone) {
  const rosterJsonRef = ref(database, 'users/' + uid + '/rostersJson');
  onValue(rosterJsonRef, (snapshot) => {
    const data = snapshot.val();
    onReadDone(data);
  });
}

export {auth, app, saveToDatabase, readFromDatabase};