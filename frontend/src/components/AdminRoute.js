import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 管理后台：管理员与商家均可进入（数据范围由后端按角色过滤）
  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'merchant')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
