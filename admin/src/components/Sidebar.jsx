import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-l transition text-sm font-medium ${
      isActive
        ? 'bg-black text-white border-r-4 border-black'
        : 'text-gray-600 hover:bg-gray-100 hover:text-black border border-transparent'
    }`

  return (
    <div className='w-[18%] min-h-screen border-r border-gray-200 bg-white'>
      <div className='flex flex-col gap-2 pt-6 pl-4 md:pl-6 text-[14px]'>
        {/* Dashboard Link */}
        <NavLink to='/' className={linkClasses} end>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
          </svg>
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>

        {/* Add Items */}
        <NavLink to='/add' className={linkClasses}>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          <p className='hidden md:block'>Add Items</p>
        </NavLink>

        {/* List Items */}
        <NavLink to='/list' className={linkClasses}>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 10h16M4 14h16M4 18h16' />
          </svg>
          <p className='hidden md:block'>List Items</p>
        </NavLink>

        {/* Inventory Management */}
        <NavLink to='/inventory' className={linkClasses}>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
          </svg>
          <p className='hidden md:block'>Inventory</p>
        </NavLink>

        {/* Orders */}
        <NavLink to='/orders' className={linkClasses}>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
          </svg>
          <p className='hidden md:block'>Orders</p>
        </NavLink>

        {/* Coupons */}
        <NavLink to='/coupons' className={linkClasses}>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
          </svg>
          <p className='hidden md:block'>Coupons</p>
        </NavLink>

        {/* Seller Portal */}
        <NavLink to='/seller' className={linkClasses}>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
          </svg>
          <p className='hidden md:block'>Seller Portal</p>
        </NavLink>

        {/* Customers / Users */}
        <NavLink to='/users' className={linkClasses}>
          <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
          </svg>
          <p className='hidden md:block'>Customers</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar