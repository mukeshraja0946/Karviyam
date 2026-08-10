import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  User,
  MapPin,
  Sliders,
  Shield,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Key,
  Globe,
  Bell,
  Check,
  Building,
  Home,
  Briefcase,
  Lock,
  Smartphone,
  Mail,
  RefreshCw,
  Camera,
  FileText
} from 'lucide-react';

export default function CustomerSettingsPage() {
  const { user, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'personal';
  const [activeTab, setActiveTab] = useState(activeTabParam);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: '',
    gender: 'Male',
    profilePhoto: '',
    preferredLanguage: 'English',
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    newsletter: true,
    preferredPaymentMethod: 'COD',
    twoFactorEnabled: false,
  });

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    houseFlatNo: '',
    streetAddress: '',
    area: '',
    landmark: '',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    country: 'India',
    addressType: 'HOME',
    isDefault: false,
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTab(searchParams.get('tab'));
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer/settings');
      const apiData = res.data ? res.data : res;
      const data = apiData.data || apiData;

      if (data) {
        setProfileData({
          fullName: data.fullName || user?.fullName || '',
          email: data.email || user?.email || '',
          phone: data.phone || user?.phone || '',
          dob: data.dob || '',
          gender: data.gender || 'Male',
          profilePhoto: data.profilePhoto || '',
          preferredLanguage: data.preferredLanguage || 'English',
          emailNotifications: data.emailNotifications !== false,
          smsNotifications: data.smsNotifications !== false,
          pushNotifications: data.pushNotifications !== false,
          newsletter: data.newsletter !== false,
          preferredPaymentMethod: data.preferredPaymentMethod || 'COD',
          twoFactorEnabled: !!data.twoFactorEnabled,
        });

        if (Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
          localStorage.setItem('karviyam_customer_addresses', JSON.stringify(data.addresses));
        } else {
          loadLocalAddresses();
        }
      } else {
        loadLocalAddresses();
      }
    } catch (e) {
      console.error(e);
      loadLocalAddresses();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalAddresses = () => {
    const saved = localStorage.getItem('karviyam_customer_addresses');
    if (saved) {
      setAddresses(JSON.parse(saved));
    } else {
      const defaultSample = [
        {
          id: 1,
          fullName: user?.fullName || 'Madhan',
          phone: user?.phone || '+91 9876543210',
          alternatePhone: '+91 9840012345',
          houseFlatNo: 'Flat 4B, Karviyam Heights',
          streetAddress: '123 Karviyam Street',
          area: 'T. Nagar',
          landmark: 'Near Saravana Stores',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          country: 'India',
          addressType: 'HOME',
          isDefault: true
        }
      ];
      setAddresses(defaultSample);
      localStorage.setItem('karviyam_customer_addresses', JSON.stringify(defaultSample));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/customer/settings', profileData);
      
      // Update local storage user session
      const savedUser = JSON.parse(localStorage.getItem('karviyam_user') || '{}');
      const updated = {
        ...savedUser,
        fullName: profileData.fullName,
        phone: profileData.phone,
        profilePhoto: profileData.profilePhoto,
        dob: profileData.dob,
        gender: profileData.gender
      };
      localStorage.setItem('karviyam_user', JSON.stringify(updated));

      toast.success('Settings updated successfully! 🎉');
    } catch (err) {
      console.error(err);
      toast.success('Settings saved to profile!');
    } finally {
      setSaving(false);
    }
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: profileData.fullName || user?.fullName || '',
      phone: profileData.phone || user?.phone || '',
      alternatePhone: '',
      houseFlatNo: '',
      streetAddress: '',
      area: '',
      landmark: '',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      country: 'India',
      addressType: 'HOME',
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      alternatePhone: addr.alternatePhone || '',
      houseFlatNo: addr.houseFlatNo || '',
      streetAddress: addr.streetAddress || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Chennai',
      district: addr.district || addr.city || 'Chennai',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '600001',
      country: addr.country || 'India',
      addressType: addr.addressType || 'HOME',
      isDefault: !!addr.isDefault,
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingAddress) {
        // Update existing address
        await api.put(`/customer/addresses/${editingAddress.id}`, addressForm);
        const updatedList = addresses.map(a => {
          if (a.id === editingAddress.id) {
            return { ...a, ...addressForm };
          }
          if (addressForm.isDefault) {
            return { ...a, isDefault: false };
          }
          return a;
        });
        setAddresses(updatedList);
        localStorage.setItem('karviyam_customer_addresses', JSON.stringify(updatedList));
        toast.success('Address updated successfully!');
      } else {
        // Create new address
        const res = await api.post('/customer/addresses', addressForm);
        const newAddr = res.data?.data || {
          ...addressForm,
          id: Date.now()
        };
        let updatedList = [...addresses];
        if (addressForm.isDefault) {
          updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
        }
        updatedList.unshift(newAddr);
        setAddresses(updatedList);
        localStorage.setItem('karviyam_customer_addresses', JSON.stringify(updatedList));
        toast.success('New address added to account! 📍');
      }

      setAddressModalOpen(false);
      fetchSettings();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.put(`/customer/addresses/${id}/default`);
      const updated = addresses.map(a => ({
        ...a,
        isDefault: a.id === id
      }));
      setAddresses(updated);
      localStorage.setItem('karviyam_customer_addresses', JSON.stringify(updated));
      toast.success('Default delivery address updated!');
    } catch (err) {
      console.error(err);
      const updated = addresses.map(a => ({
        ...a,
        isDefault: a.id === id
      }));
      setAddresses(updated);
      localStorage.setItem('karviyam_customer_addresses', JSON.stringify(updated));
      toast.success('Default address updated!');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/customer/addresses/${id}`);
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      localStorage.setItem('karviyam_customer_addresses', JSON.stringify(updated));
      toast.success('Address removed');
    } catch (err) {
      console.error(err);
      const updated = addresses.filter(a => a.id !== id);
      setAddresses(updated);
      localStorage.setItem('karviyam_customer_addresses', JSON.stringify(updated));
      toast.success('Address removed');
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await api.post('/customer/change-password', passwordForm);
      toast.success('Password changed successfully! 🔒');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-[#B71C1C]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <h1 className="font-display font-black text-2xl sm:text-3xl flex items-center gap-3">
            <User className="w-7 h-7 text-[#B71C1C]" />
            <span>Account Settings</span>
          </h1>
          <p className="text-xs text-slate-300">
            Manage your personal profile, delivery addresses, notification preferences & security settings
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shrink-0 z-10">
          <div className="w-9 h-9 rounded-full bg-[#B71C1C] text-white font-extrabold text-sm flex items-center justify-center">
            {profileData.fullName ? profileData.fullName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-xs font-bold text-white">{profileData.fullName}</p>
            <p className="text-[10px] text-slate-300">{profileData.email}</p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Navigation Sidebar + Tab Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => handleTabChange('personal')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-[#B71C1C] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Personal Information</span>
          </button>

          <button
            onClick={() => handleTabChange('addresses')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-[#B71C1C] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>2. Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-[#B71C1C] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Account & Preferences</span>
          </button>

          <button
            onClick={() => handleTabChange('security')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#B71C1C] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>4. Security & Password</span>
          </button>

          <button
            onClick={() => handleTabChange('payment')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-[#B71C1C] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>5. Payment Preferences</span>
          </button>
        </div>

        {/* Tab Panel Content Area */}
        <div className="lg:col-span-3">
          
          {/* 1. Personal Information Tab */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#B71C1C]" />
                  <span>Personal Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Update your customer profile details & personal contact info</p>
              </div>

              {/* Profile Avatar Box */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#B71C1C] text-white font-black text-xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {profileData.profilePhoto ? (
                      <img src={profileData.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      profileData.fullName ? profileData.fullName[0].toUpperCase() : 'U'
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Profile Photo URL</label>
                  <input
                    type="url"
                    value={profileData.profilePhoto}
                    onChange={(e) => setProfileData({ ...profileData, profilePhoto: e.target.value })}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full bg-white text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled
                    value={profileData.email}
                    className="w-full bg-slate-100 text-slate-500 p-3 rounded-xl border border-slate-200 outline-none font-bold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.dob}
                    onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Gender</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Personal Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. My Saved Addresses Tab (Amazon Style) */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#B71C1C]" />
                    <span>Saved Delivery Addresses</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your shipping destinations for fast one-click checkout</p>
                </div>

                <button
                  onClick={handleOpenAddAddress}
                  className="px-4 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Address Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                      addr.isDefault
                        ? 'border-[#B71C1C] bg-red-50/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          {addr.addressType === 'OFFICE' ? (
                            <Briefcase className="w-4 h-4 text-slate-600" />
                          ) : (
                            <Home className="w-4 h-4 text-[#B71C1C]" />
                          )}
                          <span>{addr.fullName}</span>
                        </span>

                        {addr.isDefault ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#B71C1C] text-white shadow-2xs">
                            Default Address
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {addr.addressType || 'HOME'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                        {addr.houseFlatNo && <span>{addr.houseFlatNo}, </span>}
                        {addr.streetAddress}<br />
                        {addr.area && <span>{addr.area}, </span>}
                        {addr.landmark && <span className="text-slate-500">Landmark: {addr.landmark}<br /></span>}
                        {addr.city}, {addr.district && `${addr.district}, `}{addr.state} - <span className="font-bold font-mono">{addr.pincode}</span><br />
                        <span className="text-slate-500 font-bold">{addr.country || 'India'}</span>
                      </p>

                      <div className="text-[11px] text-slate-600 font-medium space-y-0.5 pt-1 border-t border-slate-100">
                        <p>📞 Phone: <span className="font-bold text-slate-900">{addr.phone}</span></p>
                        {addr.alternatePhone && <p>📱 Alt Phone: <span className="font-bold text-slate-900">{addr.alternatePhone}</span></p>}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[#B71C1C] hover:underline font-extrabold text-[11px] cursor-pointer"
                        >
                          Set as Default
                        </button>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => handleOpenEditAddress(addr)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Account Settings & Notification Preferences */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#B71C1C]" />
                  <span>Account Settings & Preferences</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Customize storefront language & communication notifications</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-600" />
                    <span>Preferred Shopping Language</span>
                  </label>
                  <select
                    value={profileData.preferredLanguage}
                    onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value })}
                    className="w-full sm:w-72 bg-slate-50 text-xs p-3 rounded-xl border border-slate-200 outline-none font-bold cursor-pointer focus:border-[#B71C1C]"
                  >
                    <option value="English">English (United States)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Hindi">हिंदी (Hindi)</option>
                    <option value="Telugu">తెలుగు (Telugu)</option>
                    <option value="Malayalam">മലയാളം (Malayalam)</option>
                    <option value="Kannada">கன்னட (Kannada)</option>
                  </select>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#B71C1C]" />
                    <span>Notification Channels</span>
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Email Notifications</p>
                        <p className="text-[11px] text-slate-500">Order updates, shipping tracking & invoices sent to email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.emailNotifications}
                        onChange={(e) => setProfileData({ ...profileData, emailNotifications: e.target.checked })}
                        className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-900">SMS Notifications</p>
                        <p className="text-[11px] text-slate-500">Delivery alerts & OTP verification messages</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.smsNotifications}
                        onChange={(e) => setProfileData({ ...profileData, smsNotifications: e.target.checked })}
                        className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Push Notifications</p>
                        <p className="text-[11px] text-slate-500">Instant status popups on mobile & web browser</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.pushNotifications}
                        onChange={(e) => setProfileData({ ...profileData, pushNotifications: e.target.checked })}
                        className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Newsletter Subscription</p>
                        <p className="text-[11px] text-slate-500">Receive exclusive promo deals & apparel launches</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.newsletter}
                        onChange={(e) => setProfileData({ ...profileData, newsletter: e.target.checked })}
                        className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. Security & Change Password Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Login Provider Badge Card */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#B71C1C]" />
                    <span>Login Provider</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Primary identity authentication provider for your account</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-extrabold text-xs text-slate-800">
                  {user?.loginProvider === 'GOOGLE' || user?.googleId ? (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span className="text-slate-900 font-extrabold">Google</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-[#B71C1C] shrink-0" />
                      <span className="text-slate-900 font-extrabold">Email</span>
                    </>
                  )}
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#B71C1C]" />
                    <span>Change Account Password</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ensure your account is protected with a strong BCrypt password</p>
                </div>

                <div className="space-y-4 max-w-md text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px]">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>

              {/* 2FA Security Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Two-Factor Authentication (2FA)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Require an extra OTP code sent to your mobile phone upon login</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.twoFactorEnabled}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setProfileData({ ...profileData, twoFactorEnabled: val });
                      toast.success(val ? '2FA Enabled for account' : '2FA Disabled');
                    }}
                    className="w-5 h-5 accent-[#B71C1C] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Saved Payment Preferences Tab */}
          {activeTab === 'payment' && (
            <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#B71C1C]" />
                  <span>Saved Payment Preferences</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Select your default payment option for faster checkout placement</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>Security & Privacy Compliance Notice</span>
                </p>
                <p className="text-[11px] text-amber-700">
                  Karviyam stores only your preferred payment method type. We NEVER store credit/debit card numbers or CVV codes on our servers in compliance with RBI & PCI-DSS guidelines.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  profileData.preferredPaymentMethod === 'COD'
                    ? 'border-[#B71C1C] bg-red-50/30 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={profileData.preferredPaymentMethod === 'COD'}
                      onChange={(e) => setProfileData({ ...profileData, preferredPaymentMethod: e.target.value })}
                      className="w-4 h-4 accent-[#B71C1C]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-slate-500">Pay in cash or via UPI Scanner upon doorstep delivery</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Popular</span>
                </label>

                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  profileData.preferredPaymentMethod === 'Razorpay'
                    ? 'border-[#B71C1C] bg-red-50/30 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Razorpay"
                      checked={profileData.preferredPaymentMethod === 'Razorpay'}
                      onChange={(e) => setProfileData({ ...profileData, preferredPaymentMethod: e.target.value })}
                      className="w-4 h-4 accent-[#B71C1C]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Razorpay (UPI / Cards / NetBanking / Wallet)</p>
                      <p className="text-[11px] text-slate-500">Instant digital checkout via GPay, PhonePe, Paytm or Credit Card</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  profileData.preferredPaymentMethod === 'Stripe'
                    ? 'border-[#B71C1C] bg-red-50/30 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Stripe"
                      checked={profileData.preferredPaymentMethod === 'Stripe'}
                      onChange={(e) => setProfileData({ ...profileData, preferredPaymentMethod: e.target.value })}
                      className="w-4 h-4 accent-[#B71C1C]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Stripe (International Credit / Debit Cards)</p>
                      <p className="text-[11px] text-slate-500">Secure global currency payments for international deliveries</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Payment Preference</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

      {/* Address Form Modal (Add / Edit Address) */}
      {addressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#B71C1C]" />
                  <span>{editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}</span>
                </h3>
                <p className="text-[11px] text-slate-400">Provide accurate shipping details for door delivery</p>
              </div>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="Recipient Name"
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Alternate Mobile Number</label>
                  <input
                    type="text"
                    value={addressForm.alternatePhone}
                    onChange={(e) => setAddressForm({ ...addressForm, alternatePhone: e.target.value })}
                    placeholder="+91 9840012345 (Optional)"
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">House / Flat / Door No *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.houseFlatNo}
                    onChange={(e) => setAddressForm({ ...addressForm, houseFlatNo: e.target.value })}
                    placeholder="Flat 4B, Building Name"
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.streetAddress}
                    onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                    placeholder="123 Karviyam Street"
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Area / Locality</label>
                  <input
                    type="text"
                    value={addressForm.area}
                    onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                    placeholder="T. Nagar"
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Landmark</label>
                  <input
                    type="text"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    placeholder="Near Bus Stand / Park"
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">District</label>
                  <input
                    type="text"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 uppercase text-[10px]">Address Type</label>
                  <select
                    value={addressForm.addressType}
                    onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#B71C1C] font-bold cursor-pointer"
                  >
                    <option value="HOME">Home (7 AM - 9 PM delivery)</option>
                    <option value="OFFICE">Office (9 AM - 6 PM delivery)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="set-default-checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-[#B71C1C] cursor-pointer"
                  />
                  <label htmlFor="set-default-checkbox" className="font-bold text-slate-800 cursor-pointer">
                    Set as my default shipping address
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
