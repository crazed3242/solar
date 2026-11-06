import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Wrench,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { formatPHTDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const UsersView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    password: 'SolarPower2026!',
    role: 'technician' as UserRole,
    department: 'Electrical Maintenance',
    phone: '+63 9',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'deactivated' : 'active';
    try {
      await api.updateUserStatus(user.id, nextStatus);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Personnel & Technician Management
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              Admin & Technician Roles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage user accounts, assign roles, monitor individual technician workloads, and handle account activation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" /> Add Plant Employee
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <span className="text-slate-400 font-mono text-xs">
          Active Technicians: <strong className="text-amber-400">{users.filter((u) => u.role === 'technician' && u.status === 'active').length}</strong>
        </span>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <Clock className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
          Loading employee records...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-slate-850 border border-slate-800 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Employee ID</th>
                <th className="p-3.5">Full Name & Contact</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5 text-center">Active Jobs</th>
                <th className="p-3.5 text-center">Completed</th>
                <th className="p-3.5 text-center">Account Status</th>
                {isAdmin && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((u) => {
                const isUserAdmin = u.role === 'admin';
                return (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-mono text-amber-400 font-bold">{u.employee_id}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        {u.full_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</span>
                        {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</span>}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        isUserAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-300 font-medium">{u.department}</td>

                    <td className="p-3.5 text-center font-mono font-bold text-amber-400">
                      {u.active_workload || 0}
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                      {u.completed_jobs || 0}
                    </td>

                    <td className="p-3.5 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="p-3.5 text-right font-mono">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                              u.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-xs text-slate-100 space-y-4">
            <h3 className="font-bold text-base">Add New Plant Employee</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-TEC-105"
                    value={newUser.employee_id}
                    onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  >
                    <option value="technician">Technician</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gabriel Mendoza"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="gabriel.mendoza@sunpeak.ph"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Department</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-[10px] mb-1">Phone</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
