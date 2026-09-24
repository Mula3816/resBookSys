import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Templates
import MainTemplate from './templates/MainTemplate';
import AuthTemplate from './templates/AuthTemplate';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import ReservationsPage from './pages/ReservationsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminTables from './pages/admin/AdminTables';
import AdminReservations from './pages/admin/AdminReservations';
import AdminUsers from './pages/admin/AdminUsers';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainTemplate />}>
          <Route index element={<HomePage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthTemplate />}>
          <Route path="login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route path="register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/" element={<MainTemplate />}>
          <Route path="booking/:restaurantId" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="reservations" element={
            <ProtectedRoute>
              <ReservationsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <MainTemplate />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="tables" element={<AdminTables />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
