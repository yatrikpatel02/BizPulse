import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthLayout from './components/AuthLayout';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Data from './pages/Data';
import DataViewer from './pages/DataViewer';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import MarketIntelligence from './pages/MarketIntelligence';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BusinessProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
            <Route path="/signup" element={<AuthLayout><Signup /></AuthLayout>} />
            <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/data" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Data />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/data/records" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DataViewer />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Analytics />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Products />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/insights" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Insights />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/market-intelligence" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MarketIntelligence />
                </DashboardLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </BusinessProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
