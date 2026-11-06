import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck2,
  Cpu,
  Package,
  FileBarChart,
  Users,
  History,
  ShieldAlert,
  CalendarDays,
  FileCheck2,
  DatabaseZap,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  highlight?: boolean;
  acidBadge?: boolean;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Admin Command', icon: LayoutDashboard },
    { id: 'work_orders', label: 'Work Orders', icon: ClipboardList, badge: 'All' },
    { id: 'daily_activity', label: 'Daily Activity Monitor', icon: CalendarDays, highlight: true },
    { id: 'equipment', label: 'Equipment & History', icon: Cpu },
    { id: 'preventive', label: 'PM Schedules & Checklists', icon: CalendarCheck2 },
    { id: 'inventory', label: 'Spare Parts & Inventory', icon: Package },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart, badge: '12' },
    { id: 'users', label: 'Technician Management', icon: Users },
    { id: 'audit', label: 'System Audit Trail', icon: History },
    { id: 'acid_compliance', label: 'ACID Compliance Suite', icon: DatabaseZap, acidBadge: true },
  ];

  const technicianNavItems: NavItem[] = [
    { id: 'tech_dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'tech_work_orders', label: 'Work Orders & Requests', icon: ClipboardList },
    { id: 'daily_activity', label: 'Daily Activity Log', icon: CalendarDays },
    { id: 'equipment', label: 'Equipment Registry', icon: Cpu },
    { id: 'inventory', label: 'Spare Parts Catalog', icon: Package },
  ];

  const navItems = isAdmin ? adminNavItems : technicianNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 z-40 h-full lg:h-[calc(100vh-57px)] w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Role Status Tag */}
          <div className="mb-4 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Active Environment
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-semibold text-slate-200">
                {isAdmin ? 'Admin Console' : 'Technician Field Terminal'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.highlight && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      Live
                    </span>
                  )}

                  {item.acidBadge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ACID
                    </span>
                  )}

                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-920">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Solar Panel Power Plant</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 leading-tight">
              Location: <span className="text-emerald-400 font-mono">Kirahon, Misamis Oriental</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              {isAdmin ? 'DB: SQLite WAL (ACID Safe)' : 'Terminal Status: Field Ready'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
