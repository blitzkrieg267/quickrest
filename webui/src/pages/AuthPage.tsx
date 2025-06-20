import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthForm from '../components/AuthForm'

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  useEffect(() => {
    setIsLogin(location.pathname === '/login' || location.pathname === '/')
  }, [location.pathname])

  const handleToggleMode = () => {
    const newPath = isLogin ? '/register' : '/login'
    navigate(newPath)
    setIsLogin(!isLogin)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50"></div>
      <div className="relative z-10 w-full max-w-md">
        <AuthForm isLogin={isLogin} onToggleMode={handleToggleMode} />
      </div>
    </div>
  )
}