import React from 'react'
import Logo from './Logo'

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
            <div className='mb-5'>
              <Logo />
            </div>
            <p className='w-full md:w-2/3 text-gray-600 leading-relaxed'>
              NEXUS is your premier destination for modern lifestyle, innovative fashion, and seamless online shopping. Built with lightning-fast delivery, curated collections, and customer-first service.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>COMPANY</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>Home</li>
                <li>About us</li>
                <li>Delivery</li>
                <li>Privacy policy</li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>+1-800-NEXUS-HQ</li>
                <li>support@nexusmarketplace.com</li>
            </ul>
        </div>

      </div>

        <div>
            <hr />
            <p className='py-5 text-sm text-center text-gray-500'>Copyright 2024-2026@ nexusmarketplace.com - All Rights Reserved.</p>
        </div>

    </div>
  )
}

export default Footer
