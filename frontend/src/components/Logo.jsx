import React from 'react'

const Logo = ({ dark = false, showTagline = true }) => {
  return (
    <div className='flex items-center gap-2 select-none group cursor-pointer'>
      <div className='w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-black text-white flex items-center justify-center font-black text-lg tracking-tighter shadow-sm group-hover:bg-indigo-600 transition-colors duration-200'>
        <span className='font-serif italic text-amber-400 mr-0.5'>N</span>
        <span className='text-xs font-mono font-bold'>X</span>
      </div>
      <div className='flex flex-col'>
        <span className={`font-black tracking-[0.18em] leading-none ${dark ? 'text-white' : 'text-gray-900'} text-xl sm:text-2xl`}>
          NEXUS
        </span>
        {showTagline && (
          <span className='text-[9px] font-bold tracking-[0.25em] text-gray-600 uppercase mt-0.5'>
            MARKETPLACE
          </span>
        )}
      </div>
    </div>
  )
}

export default Logo
