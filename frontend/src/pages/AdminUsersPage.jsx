import React, { useEffect, useState } from 'react';
import { Users, Shield, Mail, Phone, Calendar, Search, Filter, CheckCircle2, UserCheck, Plus, X, Edit2, Trash2, Power } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ExportDropdown from '../components/ExportDropdown';

const USER_EXPORT_HEADERS = [
  { label: 'Full Name', accessor: 'fullName' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  { label: 'Role', accessor: (u) => Array.isArray(u.roles) ? u.roles.join(', ') : u.role || 'USER' },
  { label: 'Status', accessor: 'status' }
];

const INITIAL_FALLBACK_USERS = [
  {
    id: 1,
    fullName: 'Karviyam Super Admin',
    email: 'admin@karviyam.com',
    phone: '+91 98765 43210',
    roles: ['ROLE_ADMIN'],
    status: 'ACTIVE',
    createdAt: '2026-01-01T10:00:00'
  },
  {
    id: 5,
    fullName: 'Kavita Manager',
    email: 'manager@karviyam.com',
    phone: '+91 94444 33221',
    roles: ['ROLE_MANAGER'],
    status: 'ACTIVE',
    createdAt: '2026-02-15T11:20:00'
  }
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('karviyam_admin_staff_users');
      return saved ? JSON.parse(saved) : INITIAL_FALLBACK_USERS;
    } catch (e) {
      return INITIAL_FALLBACK_USERS;
    }
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'ROLE_ADMIN',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('karviyam_admin_staff_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed);
          setLoading(false);
          return;
        }
      }
      const res = await api.get('/admin/users');
      const data = res?.data || res || [];
      if (Array.isArray(data) && data.length > 0) {
        const staffOnly = data.filter((u) =>
          (u.roles || []).some((r) => r.includes('ADMIN') || r.includes('MANAGER') || r.includes('STAFF'))
        );
        if (staffOnly.length > 0) {
          setUsers(staffOnly);
          localStorage.setItem('karviyam_admin_staff_users', JSON.stringify(staffOnly));
        } else {
          loadStoredOrFallback();
        }
      } else {
        loadStoredOrFallback();
      }
    } catch (err) {
      loadStoredOrFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadStoredOrFallback = () => {
    const saved = localStorage.getItem('karviyam_admin_staff_users');
    if (saved) {
      setUsers(JSON.parse(saved));
    } else {
      setUsers(INITIAL_FALLBACK_USERS);
      localStorage.setItem('karviyam_admin_staff_users', JSON.stringify(INITIAL_FALLBACK_USERS));
    }
  };

  const saveUsersToStorage = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('karviyam_admin_staff_users', JSON.stringify(updatedUsers));
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'ROLE_ADMIN',
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    const mainRole = (u.roles && u.roles.length > 0) ? u.roles[0] : 'ROLE_ADMIN';
    setFormData({
      fullName: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
      role: mainRole.startsWith('ROLE_') ? mainRole : `ROLE_${mainRole}`,
      status: u.status || 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error('Please fill in required name and email fields');
      return;
    }

    let updatedList;
    if (editingUser) {
      updatedList = users.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              roles: [formData.role],
              status: formData.status
            }
          : u
      );
      toast.success('Staff account updated successfully!');
    } else {
      const newUser = {
        id: Date.now(),
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        roles: [formData.role],
        status: formData.status,
        createdAt: new Date().toISOString()
      };
      updatedList = [...users, newUser];
      toast.success('New staff member added successfully!');
    }

    saveUsersToStorage(updatedList);
    setModalOpen(false);
  };

  const handleDeleteUser = (id) => {
    if (users.length <= 1) {
      toast.error('Cannot remove the last super admin account');
      return;
    }
    const updated = users.filter((u) => u.id !== id);
    saveUsersToStorage(updated);
    toast.success('Staff user removed!');
  };

  // Exclude users whose ONLY role is ROLE_CUSTOMER
  const staffUsers = users.filter((u) => {
    const roles = u.roles || [];
    if (roles.length === 0) return true;
    return roles.some((r) =>
      r.includes('ADMIN') || r.includes('MANAGER') || r.includes('STAFF')
    );
  });

  const filteredUsers = (staffUsers.length > 0 ? staffUsers : INITIAL_FALLBACK_USERS).filter((user) => {
    const nameMatch = (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (user.phone || '').includes(searchQuery);

    const matchesSearch = nameMatch || emailMatch || phoneMatch;
    if (!matchesSearch) return false;

    if (selectedRole === 'ALL') return true;
    const userRoles = user.roles || [];
    return userRoles.some((r) => r.toLowerCase().includes(selectedRole.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#B71C1C]" />
            <span>Staff & Administrative User Management</span>
          </h1>
          <p className="text-xs text-slate-500">Manage administrative platform accounts, staff permissions, and system roles</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="users_report"
            title="Users Management Report"
            headers={USER_EXPORT_HEADERS}
            data={filteredUsers}
          />

          <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#B71C1C]" />
            <span>Total Staff: {filteredUsers.length}</span>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff accounts by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#B71C1C]"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Staff' },
            { id: 'ADMIN', label: 'Admins' },
            { id: 'MANAGER', label: 'Managers' },
          ].map((tab) => {
            const isActive = selectedRole === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#B71C1C] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl text-center text-xs text-slate-500 font-medium border border-slate-200">
          Loading staff user accounts...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4">Staff Details</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Administrative Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      No administrative staff accounts match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const rawRoles = u.roles || ['ROLE_ADMIN'];
                    const staffRoles = rawRoles.filter((r) => !r.includes('CUSTOMER'));
                    const displayRoles = staffRoles.length > 0 ? staffRoles : ['ROLE_ADMIN'];

                    const isAdmin = displayRoles.some((r) => r.includes('ADMIN'));
                    const isManager = displayRoles.some((r) => r.includes('MANAGER'));
                    const isActive = (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shadow-xs ${
                                isAdmin
                                  ? 'bg-purple-600 text-white'
                                  : isManager
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-[#B71C1C] text-white'
                              }`}
                            >
                              {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{u.fullName || 'Staff User'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Staff ID: #{u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="text-slate-800 font-medium flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {displayRoles.map((r, i) => {
                              const roleClean = r.replace('ROLE_', '');
                              const isRoleAdmin = roleClean === 'ADMIN';
                              const isRoleMgr = roleClean === 'MANAGER';

                              return (
                                <span
                                  key={i}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider ${
                                    isRoleAdmin
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : isRoleMgr
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  <Shield className="w-3 h-3" />
                                  <span>{roleClean}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>

                        <td className="p-4 text-slate-600 text-xs font-medium">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '01 Jan 2026'}
                        </td>

                        {/* Editable Actions Column */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#B71C1C]" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 cursor-pointer transition-all"
                              title="Delete staff account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingUser ? 'Edit Staff Account' : 'Add New Staff Member'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold focus:border-[#B71C1C]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul.verma@karviyam.com"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-[#B71C1C]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-[#B71C1C]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                >
                  <option value="ROLE_ADMIN">Admin (Full Access)</option>
                  <option value="ROLE_MANAGER">Manager (Store Operations)</option>
                  <option value="ROLE_STAFF">Staff Member</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold py-3.5 rounded-xl shadow-md uppercase tracking-wider cursor-pointer transition-all"
              >
                {editingUser ? 'Save Account Changes' : 'Create Staff Member'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
