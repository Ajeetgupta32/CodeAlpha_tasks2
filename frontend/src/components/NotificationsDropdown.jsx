import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    type: 'order',
    title: 'Order Status Update',
    message: 'Your recent order #1082 has been confirmed and is being processed for dispatch.',
    time: '2 hours ago',
    read: false,
    link: '/orders'
  },
  {
    id: 2,
    type: 'promo',
    title: '⚡ Flash Sale Live Now!',
    message: 'Grab up to 30% extra off on pure cotton t-shirts and summer essentials.',
    time: '5 hours ago',
    read: false,
    link: '/collection'
  },
  {
    id: 3,
    type: 'coupon',
    title: 'Coupon Unlocked: WELCOME10',
    message: 'Use code WELCOME10 at checkout for an instant 10% discount on all orders.',
    time: 'Yesterday',
    read: true,
    link: '/collection'
  }
];

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const { token, backendUrl } = useContext(ShopContext);

  const fetchLiveNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.post(`${backendUrl}/api/user/notifications/get`, {}, { headers: { token } });
      if (res.data.success && Array.isArray(res.data.notifications) && res.data.notifications.length > 0) {
        setNotifications(res.data.notifications.map(n => ({
          id: n.id,
          type: n.type || 'order',
          title: n.title,
          message: n.message,
          time: new Date(n.created_at || Date.now()).toLocaleDateString(),
          read: Boolean(n.isRead),
          link: n.type === 'order' ? '/orders' : '/collection'
        })));
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, [token]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (token) {
      try {
        await axios.post(`${backendUrl}/api/user/notifications/read`, {}, { headers: { token } });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n));
  };

  return (
    <div className='relative'>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-1.5 text-gray-700 hover:text-black transition'
        title="Notifications"
      >
        <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse'>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className='absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in duration-150'>
          <div className='p-3.5 bg-gray-50 border-b flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h4 className='font-bold text-xs text-gray-900 uppercase tracking-wide'>Notifications</h4>
              {unreadCount > 0 && (
                <span className='bg-red-100 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded-full'>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className='text-[11px] text-gray-500 hover:text-black font-medium'
              >
                Mark all read
              </button>
            )}
          </div>

          <div className='max-h-80 overflow-y-auto divide-y divide-gray-100'>
            {notifications.map(n => (
              <Link
                key={n.id}
                to={n.link}
                onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                className={`p-3.5 block transition hover:bg-gray-50 ${n.read ? 'opacity-70 bg-white' : 'bg-blue-50/30'}`}
              >
                <div className='flex items-start justify-between gap-2 mb-1'>
                  <h5 className={`text-xs font-semibold ${n.read ? 'text-gray-800' : 'text-gray-900 font-bold'}`}>
                    {n.title}
                  </h5>
                  <span className='text-[10px] text-gray-400 whitespace-nowrap'>{n.time}</span>
                </div>
                <p className='text-xs text-gray-600 leading-snug'>{n.message}</p>
              </Link>
            ))}
          </div>

          <div className='p-2 bg-gray-50 text-center border-t'>
            <button
              onClick={() => setIsOpen(false)}
              className='text-xs text-gray-600 hover:text-black font-semibold'
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
