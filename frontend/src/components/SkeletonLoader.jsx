import React from 'react';

const SkeletonCard = () => (
  <div className='flex flex-col gap-2 p-3 bg-white rounded-xl border border-gray-100 animate-pulse'>
    <div className='w-full aspect-square bg-gray-200 rounded-lg'></div>
    <div className='h-4 bg-gray-200 rounded w-3/4 mt-2'></div>
    <div className='flex items-center justify-between mt-1'>
      <div className='h-4 bg-gray-200 rounded w-1/4'></div>
      <div className='h-3 bg-gray-200 rounded w-1/3'></div>
    </div>
  </div>
);

const SkeletonLoader = ({ count = 8, className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
export { SkeletonCard };
