import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from './pages/ManageUsers';
import ManageLocations from './pages/ManageLocations';
import ManageHouses from './pages/ManageHouses';
import ManageRooms from './pages/ManageRooms';
import ManageAmenities from './pages/ManageAmenities';
import ManageServices from './pages/ManageServices';
import ManageExtras from './pages/ManageExtras';
import { CurrencyProvider } from './contexts/CurrencyContext';
import CurrencySelector from './components/CurrencySelector';

function App() {
  return (
    <CurrencyProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-end">
              <CurrencySelector />
            </header>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/admin-login" element={<AdminLoginPage />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="users" replace />} />
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="locations" element={<ManageLocations />} />
                  <Route path="houses" element={<ManageHouses />} />
                  <Route path="rooms" element={<ManageRooms />} />
                  <Route path="amenities" element={<ManageAmenities />} />
                  <Route path="services" element={<ManageServices />} />
                  <Route path="extras" element={<ManageExtras />} />
                </Route>
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </CurrencyProvider>
  )
}

export default App