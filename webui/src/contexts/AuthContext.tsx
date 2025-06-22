import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
import { auth } from '../config/firebase'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string, dob?: string, gender?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function register(email: string, password: string, displayName: string, dob?: string, gender?: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
    const token = await user.getIdToken()
    try {
      const response = await fetch('http://localhost:5001/quickrest-8d903/us-central1/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          dob,
          gender
        })
      })
      if (!response.ok) {
        throw new Error('Failed to create user profile')
      }
      // Ensure Firestore user doc exists
      await fetch('http://localhost:5001/quickrest-8d903/us-central1/api/auth/ensureUserDoc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.log('Backend signup error:', error)
      throw error
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
    const token = await auth.currentUser?.getIdToken()
    if (token) {
      await fetch('http://localhost:5001/quickrest-8d903/us-central1/api/auth/ensureUserDoc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    }
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const token = await user.getIdToken()
    // Only call backend to ensure Firestore user doc exists
    try {
      const response = await fetch('http://localhost:5001/quickrest-8d903/us-central1/api/auth/ensureUserDoc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend ensureUserDoc error:', errorText)
        throw new Error('Failed to ensure user profile')
      }
    } catch (error) {
      console.log('Backend Google ensureUserDoc error:', error)
      throw error
    }
  }

  async function logout() {
    await signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}