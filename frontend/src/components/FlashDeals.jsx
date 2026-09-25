import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import { Link } from 'react-router-dom';

const FlashDeals = () => {
  const { products, currency, addToCart, t } = useContext(ShopContext);

  // 12-hour countdown cycle
  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter 4 featured deals from products
  const dealProducts = products.filter(p => p.bestseller || p.price > 40).slice(0, 4);

  if (dealProducts.length === 0) return null;

  return (
    <div className='my-16 bg-gradient-to-r from-red-50/50 via-amber-50/40 to-orange-50/50 rounded-2xl p-6 sm:p-10 border border-red-100'>
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-red-200/60 pb-5'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <span className='bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase animate-pulse'>
              FLASH SALE
            </span>
            <span className='text-xs font-semibold text-red-600'>⚡ Up to 40% OFF</span>
          </div>
          <div className='text-2xl sm:text-3xl'>
            <Title text1={'DEALS OF'} text2={'THE DAY'} />
          </div>
          <p className='text-xs sm:text-sm text-gray-600'>
            {t ? t('dealsSub') : 'Limited time promotional pricing on trending fashion essentials.'}
          </p>
        </div>

        {/* Live Countdown Timer */}
        <div className='flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-red-200 shadow-xs'>
          <span className='text-xs text-gray-500 font-medium mr-1'>Ends in:</span>
          <div className='flex items-center gap-1 font-mono text-sm font-bold text-gray-900'>
            <span className='bg-gray-900 text-white px-2 py-1 rounded'>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span>:</span>
            <span className='bg-gray-900 text-white px-2 py-1 rounded'>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span>:</span>
            <span className='bg-red-600 text-white px-2 py-1 rounded'>{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {dealProducts.map((item) => {
          const discountPercent = item.bestseller ? 30 : 25;
          const originalPrice = Math.round(item.price * (1 + discountPercent / 100));
          const defaultSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'M';

          return (
            <div key={item._id} className='bg-white rounded-xl p-4 border border-gray-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group'>
              <div>
                <div className='relative overflow-hidden rounded-lg aspect-square mb-3 bg-gray-50'>
                  <span className='absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs z-10'>
                    -{discountPercent}%
                  </span>
                  <Link to={`/product/${item._id}`}>
                    <img
                      src={item.image[0]}
                      alt={item.name}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                  </Link>
                </div>

                <div className='text-xs text-amber-500 font-bold mb-1 flex items-center gap-1'>
                  <span>★ 4.8</span>
                  <span className='text-gray-400 font-normal'>(Verified Deal)</span>
                </div>

                <Link to={`/product/${item._id}`}>
                  <h4 className='text-sm font-semibold text-gray-900 line-clamp-1 group-hover:underline'>
                    {item.name}
                  </h4>
                </Link>

                <div className='flex items-baseline gap-2 mt-2'>
                  <span className='text-lg font-bold text-red-600'>{currency}{item.price}</span>
                  <span className='text-xs text-gray-400 line-through'>{currency}{originalPrice}</span>
                </div>

                {/* Claim Progress Bar */}
                <div className='mt-2.5'>
                  <div className='w-full bg-gray-100 rounded-full h-1.5 overflow-hidden'>
                    <div className='bg-orange-500 h-1.5 rounded-full' style={{ width: `${65 + (item.price % 30)}%` }}></div>
                  </div>
                  <p className='text-[10px] text-gray-500 mt-1 font-medium'>82% claimed • Limited deal</p>
                </div>
              </div>

              <button
                onClick={() => addToCart(item._id, defaultSize)}
                className='mt-4 w-full bg-black text-white text-xs py-2.5 rounded-lg hover:bg-gray-800 transition font-medium uppercase'
              >
                Claim Deal ({defaultSize})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlashDeals;
