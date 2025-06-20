import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Home, User, Calendar, Settings, Heart } from 'lucide-react'

export default function Dashboard() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">QuickRest</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {currentUser?.displayName || currentUser?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            <h2 className="text-4xl font-bold mb-4">
              Welcome to QuickRest!
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your journey to finding the perfect accommodation starts here. 
            Discover comfortable rooms in great locations, tailored to your preferences.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-primary p-3 rounded-full w-fit mb-4">
              <Home className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Room</h3>
            <p className="text-gray-600">
              Browse through our curated selection of comfortable rooms in prime locations.
            </p>
          </div>

          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-secondary p-3 rounded-full w-fit mb-4">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Booking</h3>
            <p className="text-gray-600">
              Simple and secure booking process with instant confirmation from our admin team.
            </p>
          </div>

          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-accent p-3 rounded-full w-fit mb-4">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Experience</h3>
            <p className="text-gray-600">
              Rooms categorized by preferences including gender-specific accommodations.
            </p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="card text-center bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <Settings className="h-12 w-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">More Features Coming Soon!</h3>
          <p className="text-gray-600 mb-6">
            We're working hard to bring you an amazing booking experience. Stay tuned for:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <ul className="space-y-2">
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                Room search and filtering
              </li>
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-secondary-500 rounded-full mr-3"></div>
                Real-time availability
              </li>
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-accent-500 rounded-full mr-3"></div>
                Secure payment processing
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                Booking management
              </li>
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-secondary-500 rounded-full mr-3"></div>
                Amenities and services
              </li>
              <li className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-accent-500 rounded-full mr-3"></div>
                User preferences
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}