import React from 'react'
import Logo from './Logo'

const Navbar = ({setToken}) => {
  return (
    <div className='flex items-center py-2.5 px-[4%] justify-between bg-white border-b border-gray-100 shadow-sm'>
        <Logo />
        <button onClick={()=>setToken('')} className='bg-gray-800 hover:bg-black text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition shadow-sm'>Logout</button>
    </div>
  )
}

export default Navbar