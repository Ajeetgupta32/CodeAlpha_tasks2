import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { Link } from 'react-router-dom';

const Compare = () => {
  const { compareList, products, currency, removeFromCompare, clearCompare, addToCart, getProductAverageRating, getProductReviews, t } = useContext(ShopContext);

  const compareProducts = compareList
    .map(id => products.find(p => p._id.toString() === id.toString()))
    .filter(Boolean);

  if (compareProducts.length === 0) {
    return (
      <div className='border-t pt-14 min-h-[60vh] flex flex-col items-center justify-center text-center'>
        <div className='w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4'>
          <svg className='w-8 h-8' fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className='text-xl font-medium text-gray-800 mb-2'>No products selected to compare</h3>
        <p className='text-gray-500 max-w-sm mb-6 text-sm'>
          Browse our collections and click the compare icon on products to see their features, sizes, and prices side-by-side.
        </p>
        <Link to='/collection' className='bg-black text-white px-8 py-3 text-sm hover:bg-gray-800 transition-colors uppercase font-medium rounded'>
          Browse Collections
        </Link>
      </div>
    );
  }

  return (
    <div className='border-t pt-14 pb-20'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8'>
        <div>
          <div className='text-2xl sm:text-3xl'>
            <Title text1={'PRODUCT'} text2={'COMPARISON'} />
          </div>
          <p className='text-xs sm:text-sm text-gray-500 mt-1'>
            {t ? t('compareSubtitle') : 'Compare specifications, prices, sizing, and ratings side-by-side.'}
          </p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={clearCompare}
            className='text-xs text-red-500 font-semibold hover:underline border border-red-200 px-3 py-1.5 rounded'
          >
            Clear All
          </button>
          <Link
            to='/collection'
            className='text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-3 py-1.5 rounded'
          >
            + Add More Products
          </Link>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className='overflow-x-auto pb-6'>
        <div className='min-w-[650px] border rounded-lg bg-white shadow-xs overflow-hidden'>
          {/* Header Row: Images & Titles */}
          <div className='grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border-b divide-x divide-gray-200 bg-gray-50/50'>
            <div className='p-4 font-semibold text-xs text-gray-500 uppercase flex items-center'>
              Product
            </div>
            {compareProducts.map(p => (
              <div key={p._id} className='p-4 flex flex-col items-center text-center relative group'>
                <button
                  onClick={() => removeFromCompare(p._id)}
                  className='absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 text-sm'
                  title="Remove from comparison"
                >
                  ✕
                </button>
                <Link to={`/product/${p._id}`}>
                  <img src={p.image[0]} alt={p.name} className='w-32 h-36 object-cover rounded-md mb-3 bg-gray-50 hover:scale-102 transition' />
                  <h4 className='text-sm font-semibold text-gray-900 hover:underline line-clamp-2 px-1'>
                    {p.name}
                  </h4>
                </Link>
                <div className='mt-2'>
                  <span className='text-lg font-bold text-gray-900'>{currency}{p.price}</span>
                </div>
                <button
                  onClick={() => addToCart(p._id, p.sizes && p.sizes.length > 0 ? p.sizes[0] : 'M')}
                  className='mt-3 w-full bg-black text-white text-xs py-2 rounded hover:bg-gray-800 transition uppercase font-medium shadow-2xs'
                >
                  Add To Cart
                </button>
              </div>
            ))}
          </div>

          {/* Row: Rating & Reviews */}
          <div className='grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border-b divide-x divide-gray-200'>
            <div className='p-4 font-medium text-xs text-gray-600 bg-gray-50 flex items-center'>
              Rating & Reviews
            </div>
            {compareProducts.map(p => {
              const rating = getProductAverageRating(p._id);
              const reviews = getProductReviews(p._id);
              return (
                <div key={p._id} className='p-4 text-center'>
                  <div className='flex items-center justify-center gap-1 text-amber-500 font-bold text-sm'>
                    <span>★ {rating}</span>
                  </div>
                  <span className='text-xs text-gray-500'>({reviews.length} customer reviews)</span>
                </div>
              );
            })}
          </div>

          {/* Row: Category */}
          <div className='grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border-b divide-x divide-gray-200'>
            <div className='p-4 font-medium text-xs text-gray-600 bg-gray-50 flex items-center'>
              Category
            </div>
            {compareProducts.map(p => (
              <div key={p._id} className='p-4 text-center text-sm text-gray-800 font-medium'>
                {p.category}
              </div>
            ))}
          </div>

          {/* Row: Type / SubCategory */}
          <div className='grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border-b divide-x divide-gray-200'>
            <div className='p-4 font-medium text-xs text-gray-600 bg-gray-50 flex items-center'>
              Type
            </div>
            {compareProducts.map(p => (
              <div key={p._id} className='p-4 text-center text-sm text-gray-800'>
                {p.subCategory}
              </div>
            ))}
          </div>

          {/* Row: Sizes Available */}
          <div className='grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border-b divide-x divide-gray-200'>
            <div className='p-4 font-medium text-xs text-gray-600 bg-gray-50 flex items-center'>
              Sizes Available
            </div>
            {compareProducts.map(p => (
              <div key={p._id} className='p-4 flex flex-wrap justify-center gap-1.5'>
                {Array.isArray(p.sizes) && p.sizes.length > 0 ? (
                  p.sizes.map(s => (
                    <span key={s} className='px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded font-medium border'>
                      {s}
                    </span>
                  ))
                ) : (
                  <span className='text-xs text-gray-400'>Standard</span>
                )}
              </div>
            ))}
          </div>

          {/* Row: Bestseller Status */}
          <div className='grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border-b divide-x divide-gray-200'>
            <div className='p-4 font-medium text-xs text-gray-600 bg-gray-50 flex items-center'>
              Popularity
            </div>
            {compareProducts.map(p => (
              <div key={p._id} className='p-4 text-center text-xs'>
                {p.bestseller ? (
                  <span className='bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium'>
                    Bestseller 🔥
                  </span>
                ) : (
                  <span className='text-gray-400'>Regular Collection</span>
                )}
              </div>
            ))}
          </div>

          {/* Row: Description */}
          <div className='grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] divide-x divide-gray-200'>
            <div className='p-4 font-medium text-xs text-gray-600 bg-gray-50 flex items-center'>
              Description
            </div>
            {compareProducts.map(p => (
              <div key={p._id} className='p-4 text-xs text-gray-600 leading-relaxed text-justify'>
                {p.description}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
