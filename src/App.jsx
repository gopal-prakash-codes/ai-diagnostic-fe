import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
import Login from './components/Login'
import Signup from './components/Signup'
import PatientHistory from './components/PatientHistory'
import ScheduleVisit from './components/ScheduleVisit'
import { AuthProvider, useAuth } from './context/AuthContext'
import PatientRecords from "./components/PatientRecords"
import SidebarLayout from './components/SideBar'
import RadiologyReports from "./components/RadiologyReports"
import RadiologyReportDetail from './components/RadiologyReportDetail'
import ReportView from './components/ReportView'
import ProfileDashboard from './components/ProfileDashboard'
import AcceptInvitation from './components/AcceptInvitation'
 


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to patient-record if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? <Navigate to="/patient-record" replace /> : children;
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      <Route path="/accept-invitation/:token" element={
        <AcceptInvitation />
      } />
      
      {/* Protected Routes */}
      <Route path="/patient/:patientId/history" element={
        <ProtectedRoute>
          <PatientHistory />
        </ProtectedRoute>
      } />
      <Route path="/patient/:patientId/schedule" element={
        <ProtectedRoute>
          <ScheduleVisit />
        </ProtectedRoute>
      } />

      <Route path="/patient-record" element={
        <ProtectedRoute>
          <PatientRecords />
        </ProtectedRoute>
      } />

      <Route path="/radiology" element={
        <ProtectedRoute>
          <RadiologyReports />
        </ProtectedRoute>
      } />
      <Route path="/radiology-report/:reportId" element={
        <ProtectedRoute>
          <RadiologyReportDetail />
        </ProtectedRoute>
      } />
      <Route path="/report-view/:reportId" element={
        <ProtectedRoute>
          <SidebarLayout>
            <ReportView />
          </SidebarLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfileDashboard />
        </ProtectedRoute>
      } />


      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/patient-record" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/patient-record" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  )
}

export default App