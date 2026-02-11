import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationsContext = createContext(undefined);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((payload) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setNotifications((prev) => [
      {
        id,
        read: false,
        createdAt: new Date().toISOString(),
        ...payload,
      },
      ...prev,
    ]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  /** Notifications for current user: admin sees forAdmin, school sees forUserId or forSchoolId */
  const getForUser = useCallback(
    (user) => {
      if (!user) return [];
      const isAdmin = user.role === 'sdo_admin';
      return notifications.filter((n) => {
        if (n.forAdmin && isAdmin) return true;
        if (n.forUserId && n.forUserId === user.uid) return true;
        if (n.forSchoolId && n.forSchoolId === user.schoolId) return true;
        return false;
      });
    },
    [notifications]
  );

  const unreadCountForUser = useCallback(
    (user) => getForUser(user).filter((n) => !n.read).length,
    [getForUser]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        getForUser,
        unreadCountForUser,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
