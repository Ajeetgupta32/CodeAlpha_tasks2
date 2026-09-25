import React from 'react'

const Logo = () => {
  return (
    <div className='flex items-center gap-2 select-none group cursor-pointer'>
      <div className='w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-lg tracking-tighter shadow-sm group-hover:bg-indigo-600 transition-colors'>
        <span className='font-serif italic text-amber-400 mr-0.5'>N</span>
        <span className='text-xs font-mono font-bold'>X</span>
      </div>
      <div className='flex flex-col'>
        <div className='flex items-center gap-1.5'>
          <span className='font-black tracking-[0.18em] leading-none text-gray-900 text-xl'>
            NEXUS
          </span>
          <span className='bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider'>
            ADMIN
          </span>
        </div>
        <span className='text-[8px] font-bold tracking-[0.2em] text-gray-400 uppercase mt-0.5'>
          OPERATIONS PORTAL
        </span>
      </div>
    </div>
  )
}

export default Logo
