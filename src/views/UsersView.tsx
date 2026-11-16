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
  UserCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { User, UserRole, isEmployeeRole } from '../types';
import { api } from '../services/api';
import { formatPHTDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export const UsersView: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  // Add User Modal
  const defaultNewUser = {
    employee_id: '',
    full_name: '',
    email: '',
    password: 'SolarPower2026!',
    role: 'employee' as UserRole,
    department: 'Electrical Maintenance',
    phone: '+63 9',
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState(defaultNewUser);

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

  const handleSetStatus = async (user: User, nextStatus: 'active' | 'deactivated') => {
    setFeedback(null);
    setBusyUserId(user.id);
    try {
      await api.updateUserStatus(user.id, nextStatus);
      setFeedback({
        type: 'success',
        message:
          nextStatus === 'active'
            ? `Approved and activated account for ${user.full_name}. They can now sign in.`
            : `Deactivated account for ${user.full_name}.`,
      });
      await fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user status' });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    setFeedback(null);
    setBusyUserId(user.id);
    try {
      await api.deleteUser(user.id);
      setConfirmDeleteId(null);
      setFeedback({
        type: 'success',
        message: `Deleted account for ${user.full_name} (${user.email}).`,
      });
      await fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete user account' });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.createUser(newUser);
      setShowAddModal(false);
      setNewUser(defaultNewUser);
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  const pendingUsers = users.filter((u) => u.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              User & Personnel Management
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              Admin • Manager • Employee Roles
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Approve new sign-ups before login, add plant accounts, manage roles, or remove accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setCreateError(null);
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Plant Employee
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[11px] font-mono opacity-80 hover:opacity-100 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Account Approvals Queue */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Pending Registration Requests ({pendingUsers.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-200/80">
              Accounts are blocked from signing in until approved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingUsers.map((pu) => (
              <div
                key={pu.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100">{pu.full_name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        pu.role === 'manager'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {pu.role === 'technician' ? 'employee' : pu.role}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">{pu.employee_id}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {pu.email} • {pu.department}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyUserId === pu.id}
                    onClick={() => handleSetStatus(pu, 'active')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  {confirmDeleteId === pu.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={busyUserId === pu.id}
                        onClick={() => handleDeleteUser(pu)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busyUserId === pu.id}
                      onClick={() => setConfirmDeleteId(pu.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

        <div className="flex items-center gap-3 text-slate-400 font-mono text-xs">
          <span>
            Admins: <strong className="text-amber-400">{users.filter((u) => u.role === 'admin' && u.status === 'active').length}</strong>
          </span>
          <span>•</span>
          <span>
            Managers: <strong className="text-emerald-400">{users.filter((u) => u.role === 'manager' && u.status === 'active').length}</strong>
          </span>
          <span>•</span>
          <span>
            Employees: <strong className="text-cyan-400">{users.filter((u) => isEmployeeRole(u.role) && u.status === 'active').length}</strong>
          </span>
        </div>
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
                const isUserManager = u.role === 'manager';
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
                        isUserAdmin
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : isUserManager
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {u.role === 'technician' ? 'employee' : u.role}
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
                        u.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : u.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.status === 'pending' ? 'pending approval' : u.status}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="p-3.5 text-right font-mono">
                        {u.id !== currentUser?.id && (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {u.status === 'pending' ? (
                              <button
                                onClick={() => handleSetStatus(u, 'active')}
                                disabled={busyUserId === u.id}
                                className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetStatus(u, u.status === 'active' ? 'deactivated' : 'active')}
                                disabled={busyUserId === u.id}
                                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                  u.status === 'active'
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                              </button>
                            )}

                            {confirmDeleteId === u.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={busyUserId === u.id}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded text-[10px] bg-slate-800 text-slate-300 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                disabled={busyUserId === u.id}
                                title="Delete Account"
                                className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
            {createError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                {createError}
              </div>
            )}
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
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
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

              <div>
                <label className="block text-slate-400 font-mono text-[10px] mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
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
                  disabled={creating}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
