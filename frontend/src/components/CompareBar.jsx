import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';

const CompareBar = () => {
  const { compareList, products, removeFromCompare, clearCompare, t } = useContext(ShopContext);

  if (!compareList || compareList.length === 0) return null;

  const compareProducts = compareList
    .map(id => products.find(p => p._id.toString() === id.toString()))
    .filter(Boolean);

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-300 shadow-2xl py-3 px-4 sm:px-8 transition-transform duration-300'>
      <div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <div className='bg-black text-white text-xs font-bold px-2.5 py-1 rounded-full'>
            {compareProducts.length}/4
          </div>
          <div>
            <h4 className='text-sm font-semibold text-gray-900'>{t ? t('compareBarTitle') : 'Compare Products'}</h4>
            <p className='text-xs text-gray-500'>Compare items side-by-side</p>
          </div>
        </div>

        {/* Selected Product Thumbnails */}
        <div className='flex items-center gap-3 overflow-x-auto max-w-full py-1'>
          {compareProducts.map(p => (
            <div key={p._id} className='relative group flex-shrink-0 bg-gray-50 p-1 border rounded'>
              <img src={p.image[0]} alt={p.name} className='w-12 h-12 object-cover rounded' />
              <button
                onClick={() => removeFromCompare(p._id)}
                className='absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-600 transition'
                title="Remove from compare"
              >
                ✕
              </button>
            </div>
          ))}
          {Array.from({ length: 4 - compareProducts.length }).map((_, idx) => (
            <div key={idx} className='w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-400'>
              +
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2'>
          <button
            onClick={clearCompare}
            className='text-xs text-gray-500 hover:text-red-600 font-medium px-3 py-2'
          >
            {t ? t('clearCompare') : 'Clear'}
          </button>
          <Link
            to='/compare'
            className='bg-black text-white text-xs font-semibold px-5 py-2.5 rounded hover:bg-gray-800 transition uppercase shadow-sm'
          >
            {t ? t('compareNow') : 'Compare Now'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareBar;
