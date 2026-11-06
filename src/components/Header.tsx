import React, { useState, useEffect } from 'react';
import {
  Sun,
  Bell,
  Clock,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPHTDateTime } from '../utils/formatters';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigate }) => {
  const {
    currentUser,
    notifications,
    unreadNotifsCount,
    markNotificationRead,
    markAllNotificationsRead,
    logout,
  } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  // Live PHT Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const phtString = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setCurrentTime(phtString + ' PHT');
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-sm">
      {/* Brand & Farm Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold">
            <Sun className="w-5 h-5 animate-[spin_20s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">
                Solar Panel <span className="text-amber-400">Power Plant</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Kirahon, Misamis Oriental
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden md:block">
              Kirahon, Misamis Oriental · Maintenance Management System
            </p>
          </div>
        </div>
      </div>

      {/* Center: Live PHT Clock */}
      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono shadow-inner">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span>{currentTime}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
      </div>

      {/* Right Controls: Notifications + Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden text-slate-200">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Notifications ({notifications.length})
                  </span>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-800/50 ${
                        !n.is_read ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                      <span className="text-[10px] font-mono text-slate-500 mt-1.5 block">
                        {formatPHTDateTime(n.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Demo Role & User Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 transition-all text-left"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
              currentUser?.role === 'admin'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
            }`}>
              {currentUser?.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Wrench className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                {currentUser?.full_name || 'Loading...'}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] flex items-center gap-1 font-mono">
                <span className={`uppercase font-bold ${
                  currentUser?.role === 'admin' ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {currentUser?.role === 'admin' ? 'ADMIN' : 'TECHNICIAN'}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{currentUser?.employee_id}</span>
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-3 text-slate-200">
              <div className="pb-3 border-b border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Signed In Account
                </div>
                <div className="font-semibold text-sm text-slate-100 mt-1">
                  {currentUser?.full_name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">
                  {currentUser?.email}
                </div>
              </div>

              <div className="py-2.5 space-y-1.5 text-xs font-mono border-b border-slate-800">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Role:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    currentUser?.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {currentUser?.role === 'admin' ? 'System Administrator' : 'Field Technician'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="text-slate-200 font-bold">{currentUser?.employee_id}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{currentUser?.department}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-slate-500 leading-tight mb-2">
                  To access another account, please log out first.
                </p>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/30 transition-colors font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
