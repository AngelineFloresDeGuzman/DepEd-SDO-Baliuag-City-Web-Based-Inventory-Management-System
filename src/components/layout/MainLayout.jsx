import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const sidebarWidth = '16rem'; /* w-64 = 256px, matches sidebar */

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className="min-h-screen flex-1 min-w-0"
        style={{ marginLeft: sidebarWidth }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

