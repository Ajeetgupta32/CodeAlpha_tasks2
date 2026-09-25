import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';

const RecentlyViewed = () => {
  const { getRecentlyViewedProducts } = useContext(ShopContext);
  const recentProducts = getRecentlyViewedProducts();

  if (!recentProducts || recentProducts.length === 0) {
    return null;
  }

  return (
    <div className='my-14'>
      <div className='text-center py-8 text-3xl'>
        <Title text1={'RECENTLY'} text2={'VIEWED'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm text-gray-600'>
          Pick up right where you left off with items you recently explored.
        </p>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {recentProducts.slice(0, 5).map((item, index) => (
          <ProductItem
            key={item._id || index}
            id={item._id}
            name={item.name}
            image={item.image}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
