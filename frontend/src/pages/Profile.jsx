import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { backendUrl, token, setToken, currency, navigate } = useContext(ShopContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrFirstName, setAddrFirstName] = useState('');
  const [addrLastName, setAddrLastName] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const res = await axios.post(`${backendUrl}/api/user/profile`, {}, { headers: { token } });
      if (res.data.success) {
        setProfile(res.data.profile);
        setName(res.data.profile.name || '');
        setPhone(res.data.profile.phone || '');
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchProfile();
    }
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${backendUrl}/api/user/profile/update`,
        { name, phone },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addrStreet.trim() || !addrCity.trim()) {
      toast.error("Please enter street address and city");
      return;
    }

    try {
      const addressData = {
        firstName: addrFirstName,
        lastName: addrLastName,
        street: addrStreet,
        city: addrCity,
        state: addrState,
        zipcode: addrZip,
        phone: addrPhone,
        isDefault
      };

      const res = await axios.post(
        `${backendUrl}/api/user/address/add`,
        { address: addressData },
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success("Address added to your address book!");
        setShowAddressModal(false);
        // Reset form
        setAddrFirstName('');
        setAddrLastName('');
        setAddrStreet('');
        setAddrCity('');
        setAddrState('');
        setAddrZip('');
        setAddrPhone('');
        setIsDefault(false);
        fetchProfile();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to remove this address?")) return;
    try {
      const res = await axios.post(
        `${backendUrl}/api/user/address/delete`,
        { addressId },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.info("Address removed");
        fetchProfile();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    toast.info("Logged out successfully");
    navigate('/login');
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin'></div>
      </div>
    );
  }

  const referralCode = profile ? `NEXUS-${profile.id || 'VIP'}` : '';

  return (
    <div className='border-t pt-14 max-w-5xl mx-auto'>
      <div className='text-2xl mb-6'>
        <Title text1={'MY'} text2={'ACCOUNT & PROFILE'} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Left Column: Account Details & Rewards */}
        <div className='space-y-6'>
          {/* User Info Card */}
          <div className='bg-white p-5 rounded-2xl border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-bold text-gray-900 text-base'>Personal Profile</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className='text-xs font-semibold text-blue-600 hover:underline'
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className='space-y-3 text-xs'>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>Full Name</label>
                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                    required
                  />
                </div>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>Phone Number</label>
                  <input
                    type='text'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder='e.g. +91 9876543210'
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                  />
                </div>
                <button
                  type='submit'
                  className='w-full py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition'
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div className='space-y-2 text-xs text-gray-600'>
                <div>
                  <span className='font-medium text-gray-400 block'>Name:</span>
                  <span className='font-semibold text-gray-900 text-sm'>{profile?.name}</span>
                </div>
                <div>
                  <span className='font-medium text-gray-400 block'>Email Address:</span>
                  <span className='font-medium text-gray-800'>{profile?.email}</span>
                </div>
                <div>
                  <span className='font-medium text-gray-400 block'>Phone:</span>
                  <span className='font-medium text-gray-800'>{profile?.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className='font-medium text-gray-400 block'>Account Type:</span>
                  <span className='capitalize font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block'>
                    {profile?.role || 'Customer'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Rewards & Referral Card */}
          <div className='bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200 shadow-sm'>
            <div className='flex items-center justify-between'>
              <div>
                <span className='text-[10px] uppercase font-bold text-amber-800 tracking-wider'>
                  NEXUS Club Rewards
                </span>
                <h4 className='text-2xl font-black text-amber-900 mt-0.5'>
                  {profile?.rewardPoints || 100} Points
                </h4>
                <p className='text-xs text-amber-700 mt-1'>
                  ≈ {currency}{((profile?.rewardPoints || 100) / 10).toFixed(2)} Store Credits
                </p>
              </div>
              <span className='text-3xl'>🎁</span>
            </div>

            <div className='mt-4 pt-3 border-t border-amber-200/60'>
              <p className='text-[11px] font-semibold text-gray-700'>Your Referral Invite Code:</p>
              <div className='flex items-center gap-2 mt-1.5'>
                <span className='font-mono font-bold text-xs bg-white px-2.5 py-1 rounded border border-amber-300 text-amber-900'>
                  {referralCode}
                </span>
                <button
                  type='button'
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    toast.info(`Copied referral code "${referralCode}"!`);
                  }}
                  className='text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-2.5 py-1 rounded transition'
                >
                  Copy
                </button>
              </div>
              <span className='text-[10px] text-gray-500 block mt-1'>
                Give friends $10 off, earn 50 reward points on their first order!
              </span>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className='bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-2.5 text-xs font-medium'>
            <Link to='/orders' className='p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between text-gray-800'>
              <span className='flex items-center gap-2'>
                <span>📦</span> My Orders & Tracking
              </span>
              <span>&rarr;</span>
            </Link>
            <Link to='/wishlist' className='p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between text-gray-800'>
              <span className='flex items-center gap-2'>
                <span>❤️</span> My Wishlist
              </span>
              <span>&rarr;</span>
            </Link>
            <Link to='/cart' className='p-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between text-gray-800'>
              <span className='flex items-center gap-2'>
                <span>🛒</span> Shopping Cart
              </span>
              <span>&rarr;</span>
            </Link>
            <button
              onClick={handleLogout}
              className='mt-2 pt-2 border-t text-left p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition font-semibold'
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Right Columns (2 cols): Address Book */}
        <div className='md:col-span-2 space-y-6'>
          <div className='bg-white p-6 rounded-2xl border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between pb-4 border-b border-gray-100'>
              <div>
                <h3 className='font-bold text-gray-900 text-base'>Saved Delivery Addresses</h3>
                <p className='text-xs text-gray-500 mt-0.5'>Manage shipping destinations for 1-click checkout</p>
              </div>
              <button
                onClick={() => setShowAddressModal(true)}
                className='px-3.5 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition flex items-center gap-1.5'
              >
                <span>+ Add Address</span>
              </button>
            </div>

            {/* Address Cards List */}
            <div className='mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {profile?.addresses && profile.addresses.length > 0 ? (
                profile.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-xl border relative transition ${
                      addr.isDefault
                        ? 'border-black bg-gray-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {addr.isDefault && (
                      <span className='absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded'>
                        Default
                      </span>
                    )}
                    <h5 className='font-bold text-gray-900 text-sm'>
                      {addr.firstName} {addr.lastName}
                    </h5>
                    <p className='text-xs text-gray-600 mt-1.5 line-clamp-2'>
                      {addr.street}, {addr.city}
                    </p>
                    <p className='text-xs text-gray-600'>
                      {addr.state} {addr.zipcode}, {addr.country}
                    </p>
                    <p className='text-xs text-gray-500 mt-2'>Phone: {addr.phone || 'N/A'}</p>

                    <div className='mt-4 pt-3 border-t border-gray-100 flex items-center justify-between'>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className='text-xs text-red-500 hover:text-red-700 font-semibold'
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='col-span-full py-12 text-center text-gray-400 text-xs'>
                  <p className='text-base font-semibold text-gray-700 mb-1'>No saved addresses yet</p>
                  <p>Add your home or office address for fast, streamlined checkout.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in'>
            <div className='flex items-center justify-between pb-3 border-b'>
              <h4 className='font-bold text-gray-900 text-base'>Add New Shipping Address</h4>
              <button
                onClick={() => setShowAddressModal(false)}
                className='text-gray-400 hover:text-black text-xl font-bold'
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddAddress} className='mt-4 space-y-3 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>First Name</label>
                  <input
                    type='text'
                    value={addrFirstName}
                    onChange={(e) => setAddrFirstName(e.target.value)}
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                    required
                  />
                </div>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>Last Name</label>
                  <input
                    type='text'
                    value={addrLastName}
                    onChange={(e) => setAddrLastName(e.target.value)}
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                    required
                  />
                </div>
              </div>

              <div>
                <label className='font-medium text-gray-700 block mb-1'>Street Address</label>
                <input
                  type='text'
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder='Flat, House no., Building, Street'
                  className='w-full px-3 py-2 border rounded focus:outline-black'
                  required
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>City</label>
                  <input
                    type='text'
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                    required
                  />
                </div>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>State</label>
                  <input
                    type='text'
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                    required
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>PIN / Postal Code</label>
                  <input
                    type='text'
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                    required
                  />
                </div>
                <div>
                  <label className='font-medium text-gray-700 block mb-1'>Phone Number</label>
                  <input
                    type='text'
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className='w-full px-3 py-2 border rounded focus:outline-black'
                    required
                  />
                </div>
              </div>

              <div className='flex items-center gap-2 pt-2'>
                <input
                  type='checkbox'
                  id='isDefault'
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className='w-4 h-4 cursor-pointer accent-black'
                />
                <label htmlFor='isDefault' className='text-xs text-gray-700 cursor-pointer'>
                  Make this my default delivery address
                </label>
              </div>

              <div className='pt-3 flex items-center justify-end gap-2'>
                <button
                  type='button'
                  onClick={() => setShowAddressModal(false)}
                  className='px-4 py-2 border rounded font-medium hover:bg-gray-100 transition'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-5 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition'
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
