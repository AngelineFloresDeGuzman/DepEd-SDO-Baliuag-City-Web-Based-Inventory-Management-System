import React, { createContext, useContext, useState } from 'react';
import { users, schools } from '@/data/mockData';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    // Mock authentication - in production, this would call Firebase
    const foundUser = users.find((u) => u.email === email);
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const getSchoolName = () => {
    if (!user) return '';
    if (user.role === 'sdo_admin') return 'Schools Division Office';
    const school = schools.find((s) => s.id === user.schoolId);
    return school?.name || '';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        getSchoolName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
