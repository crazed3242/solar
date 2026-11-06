import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, NotificationItem } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  login: (usernameOrEmail: string, password?: string) => Promise<void>;
  registerEmployee: (data: {
    full_name: string;
    email: string;
    password: string;
    employee_id?: string;
    department?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  switchUser: (userId: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved session if exists
  useEffect(() => {
    async function initAuth() {
      try {
        const users = await api.getUsersList();
        setAllUsers(users);

        const savedId = localStorage.getItem('solar_plant_active_user_id');
        if (savedId) {
          const selected = users.find((u) => String(u.id) === savedId);
          if (selected && selected.status === 'active') {
            setCurrentUser(selected);
          } else {
            localStorage.removeItem('solar_plant_active_user_id');
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to init users:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  // Poll notifications when user changes
  const refreshNotifications = async () => {
    if (!currentUser) return;
    try {
      const notifs = await api.getNotifications(currentUser.id);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  const login = async (usernameOrEmail: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(usernameOrEmail, password);
      setCurrentUser(res.user);
      localStorage.setItem('solar_plant_active_user_id', String(res.user.id));
      await refreshNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const registerEmployee = async (data: {
    full_name: string;
    email: string;
    password: string;
    employee_id?: string;
    department?: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.registerEmployee(data);
      setCurrentUser(res.user);
      localStorage.setItem('solar_plant_active_user_id', String(res.user.id));
      const updatedList = await api.getUsersList();
      setAllUsers(updatedList);
      await refreshNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('solar_plant_active_user_id');
  };

  const switchUser = async (userId: number) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoUser(userId);
      setCurrentUser(res.user);
      localStorage.setItem('solar_plant_active_user_id', String(res.user.id));
      // Refresh user list to sync workloads
      const updatedList = await api.getUsersList();
      setAllUsers(updatedList);
      await refreshNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    await api.markAllNotificationsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        notifications,
        unreadNotifsCount,
        login,
        registerEmployee,
        logout,
        switchUser,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
