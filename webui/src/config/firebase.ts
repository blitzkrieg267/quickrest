import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  // These will be populated from your Firebase project
  // For now, using placeholder values - you'll need to replace these
  apiKey: "AIzaSyC0qsS6umf734-hGLMhvXM3isH6Y3rbxak",
  authDomain: "quickrest-8d903.firebaseapp.com",
  projectId: "quickrest-8d903",
  storageBucket: "quickrest-8d903.firebasestorage.app",
  messagingSenderId: "40119968782",
  appId: "1:40119968782:web:14c7b602a93fbdc946485f",
  measurementId: "G-Y3RXWPNT1W"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const analytics = getAnalytics(app)
export default app