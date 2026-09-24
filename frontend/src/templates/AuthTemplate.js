import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthLayout from '../components/layouts/AuthLayout';

const AuthTemplate = () => {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
};

export default AuthTemplate;
