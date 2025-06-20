import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  // These will be populated from your Firebase project
  // For now, using placeholder values - you'll need to replace these
  apiKey: "your-api-key",
  authDomain: "quickrest-8d903.firebaseapp.com",
  projectId: "quickrest-8d903",
  storageBucket: "quickrest-8d903.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app