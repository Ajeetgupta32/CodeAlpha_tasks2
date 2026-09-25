import React, { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import { Link, NavLink } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import NotificationsDropdown from './NotificationsDropdown';
import Logo from './Logo';

const Navbar = () => {
    const [visible, setVisible] = useState(false);

    const {
        setShowSearch,
        getCartCount,
        getWishlistCount,
        compareList,
        navigate,
        token,
        setToken,
        setCartItems,
        language,
        toggleLanguage,
        t
    } = useContext(ShopContext);

    const logout = () => {
        navigate('/login');
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
    };

    return (
        <div className='flex items-center justify-between py-5 font-medium border-b border-gray-100'>
            <Link to='/' className='flex items-center gap-1.5'>
                <Logo />
            </Link>

            <ul className='hidden md:flex gap-6 text-sm text-gray-700 font-medium'>
                <NavLink to='/' className='flex flex-col items-center gap-1 hover:text-black transition'>
                    <p>{t ? t('home') : 'HOME'}</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
                <NavLink to='/collection' className='flex flex-col items-center gap-1 hover:text-black transition'>
                    <p>{t ? t('collection') : 'COLLECTION'}</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
                <NavLink to='/about' className='flex flex-col items-center gap-1 hover:text-black transition'>
                    <p>{t ? t('about') : 'ABOUT'}</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
                <NavLink to='/contact' className='flex flex-col items-center gap-1 hover:text-black transition'>
                    <p>{t ? t('contact') : 'CONTACT'}</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
                </NavLink>
            </ul>

            <div className='flex items-center gap-3.5 sm:gap-5'>
                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className='text-xs font-bold border border-gray-300 hover:border-black px-2 py-1 rounded-md text-gray-700 hover:text-black transition flex items-center gap-1'
                    title="Switch Language (English / हिन्दी)"
                >
                    <span className='text-[13px]'>🌐</span>
                    <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
                </button>

                {/* Notifications */}
                <NotificationsDropdown />

                {/* Search */}
                <img
                    onClick={() => { setShowSearch(true); navigate('/collection'); }}
                    src={assets.search_icon}
                    className='w-5 cursor-pointer opacity-80 hover:opacity-100 transition'
                    alt="Search"
                    title="Search Catalog"
                />

                {/* User Profile */}
                <div className='group relative'>
                    <img
                        onClick={() => token ? null : navigate('/login')}
                        className='w-5 cursor-pointer opacity-80 hover:opacity-100 transition'
                        src={assets.profile_icon}
                        alt="Profile"
                    />
                    {token && (
                        <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-40'>
                            <div className='flex flex-col gap-2 w-40 py-3 px-5 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-xl text-sm'>
                                <p onClick={() => navigate('/profile')} className='cursor-pointer hover:text-black font-medium flex items-center gap-1.5'>
                                    <span>👤</span> My Profile
                                </p>
                                <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black font-medium flex items-center gap-1.5'>
                                    <span>📦</span> My Orders
                                </p>
                                <p onClick={() => navigate('/wishlist')} className='cursor-pointer hover:text-black font-medium flex items-center gap-1.5'>
                                    <span>❤️</span> My Wishlist
                                </p>
                                <p onClick={logout} className='cursor-pointer hover:text-red-600 font-medium pt-1.5 border-t flex items-center gap-1.5'>
                                    <span>🚪</span> Logout
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Comparison Link */}
                <Link to='/compare' className='relative p-1' title="Product Comparison">
                    <svg className={`w-5 h-5 transition ${compareList && compareList.length > 0 ? 'text-black font-bold' : 'text-gray-600 hover:text-black'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {compareList && compareList.length > 0 && (
                        <p className='absolute -right-1 -bottom-1 w-4 text-center leading-4 bg-indigo-600 text-white rounded-full text-[9px] font-bold'>
                            {compareList.length}
                        </p>
                    )}
                </Link>

                {/* Wishlist */}
                <Link to='/wishlist' className='relative p-1' title="Wishlist">
                    <svg
                        className={`w-5 h-5 transition-colors ${getWishlistCount() > 0 ? 'text-red-500 fill-red-500' : 'text-gray-700 hover:text-red-500'}`}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {getWishlistCount() > 0 && (
                        <p className='absolute -right-1 -bottom-1 w-4 text-center leading-4 bg-red-500 text-white rounded-full text-[9px] font-bold animate-pulse'>
                            {getWishlistCount()}
                        </p>
                    )}
                </Link>

                {/* Cart */}
                <Link to='/cart' className='relative p-1' title="Cart">
                    <img src={assets.cart_icon} className='w-5 min-w-5' alt="Cart" />
                    <p className='absolute -right-1 -bottom-1 w-4 text-center leading-4 bg-black text-white rounded-full text-[9px] font-bold'>
                        {getCartCount()}
                    </p>
                </Link>

                {/* Mobile Menu Icon */}
                <img onClick={() => setVisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer md:hidden' alt="Menu" />
            </div>

            {/* Mobile Drawer Menu */}
            <div className={`fixed top-0 right-0 bottom-0 bg-white z-50 transition-all duration-300 shadow-2xl ${visible ? 'w-64' : 'w-0 overflow-hidden'}`}>
                <div className='flex flex-col text-gray-700 h-full'>
                    <div onClick={() => setVisible(false)} className='flex items-center gap-4 p-4 border-b cursor-pointer hover:bg-gray-50'>
                        <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="Back" />
                        <span className='font-semibold text-sm'>Close Menu</span>
                    </div>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-b hover:bg-gray-50' to='/'>
                        {t ? t('home') : 'HOME'}
                    </NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-b hover:bg-gray-50' to='/collection'>
                        {t ? t('collection') : 'COLLECTION'}
                    </NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-b flex items-center justify-between pr-6 hover:bg-gray-50' to='/wishlist'>
                        <span>{t ? t('wishlist') : 'WISHLIST'}</span>
                        {getWishlistCount() > 0 && (
                            <span className='bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'>{getWishlistCount()}</span>
                        )}
                    </NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-b hover:bg-gray-50' to='/compare'>
                        {t ? t('compare') : 'COMPARE'}
                    </NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-b hover:bg-gray-50' to='/about'>
                        {t ? t('about') : 'ABOUT'}
                    </NavLink>
                    <NavLink onClick={() => setVisible(false)} className='py-3 pl-6 border-b hover:bg-gray-50' to='/contact'>
                        {t ? t('contact') : 'CONTACT'}
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
