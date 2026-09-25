import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { Link } from 'react-router-dom';

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    updateQuantity,
    navigate,
    savedForLater,
    saveForLaterAction,
    moveToCartAction,
    removeSavedForLaterAction
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item]
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  return (
    <div className='border-t pt-14 min-h-[70vh]'>
      <div className='text-2xl mb-3 flex items-center justify-between'>
        <Title text1={'YOUR'} text2={'CART'} />
        {cartData.length > 0 && (
          <span className='text-xs text-gray-500 font-normal'>
            {cartData.reduce((acc, curr) => acc + curr.quantity, 0)} items in cart
          </span>
        )}
      </div>

      {cartData.length === 0 ? (
        <div className='py-16 text-center border-b'>
          <p className='text-gray-500 text-lg mb-4'>Your shopping cart is currently empty.</p>
          <Link
            to='/collection'
            className='inline-block bg-black text-white px-8 py-3 text-sm font-medium rounded hover:bg-gray-800 transition uppercase'
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div>
          {cartData.map((item, index) => {
            const productData = products.find((product) => product._id.toString() === item._id.toString());
            if (!productData) return null;

            return (
              <div
                key={index}
                className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_1fr_0.8fr] sm:grid-cols-[4fr_1.5fr_1fr] items-center gap-4'
              >
                <div className='flex items-start gap-4 sm:gap-6'>
                  <Link to={`/product/${productData._id}`}>
                    <img className='w-16 sm:w-20 object-cover rounded bg-gray-50' src={productData.image[0]} alt={productData.name} />
                  </Link>
                  <div>
                    <Link to={`/product/${productData._id}`}>
                      <p className='text-xs sm:text-base font-medium text-gray-900 hover:underline line-clamp-1'>
                        {productData.name}
                      </p>
                    </Link>
                    <div className='flex items-center gap-3 sm:gap-5 mt-2 text-sm'>
                      <p className='font-semibold text-gray-800'>{currency}{productData.price}</p>
                      <p className='px-2 sm:px-3 py-0.5 border text-xs bg-slate-50 rounded'>Size: {item.size}</p>
                    </div>
                  </div>
                </div>

                <div className='flex items-center'>
                  <input
                    onChange={(e) => e.target.value === '' || e.target.value === '0' ? null : updateQuantity(item._id, item.size, Number(e.target.value))}
                    className='border max-w-10 sm:max-w-16 px-1.5 sm:px-2 py-1 text-center rounded text-sm outline-none'
                    type="number"
                    min={1}
                    defaultValue={item.quantity}
                  />
                </div>

                <div className='flex items-center justify-end gap-3'>
                  <button
                    onClick={() => saveForLaterAction(item._id, item.size)}
                    className='text-xs text-gray-500 hover:text-black hover:underline hidden sm:inline whitespace-nowrap'
                    title="Save this item for later purchase"
                  >
                    Save for later
                  </button>
                  <img
                    onClick={() => updateQuantity(item._id, item.size, 0)}
                    className='w-4 sm:w-5 cursor-pointer opacity-70 hover:opacity-100 transition'
                    src={assets.bin_icon}
                    alt="Remove item"
                    title="Remove item"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Summary & Checkout */}
      {cartData.length > 0 && (
        <div className='flex justify-end my-14'>
          <div className='w-full sm:w-[450px]'>
            <CartTotal />
            <div className='w-full text-end'>
              <button
                onClick={() => navigate('/place-order')}
                className='bg-black text-white text-sm my-6 px-8 py-3 rounded font-medium hover:bg-gray-800 transition uppercase shadow-sm'
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save For Later Section */}
      {savedForLater && savedForLater.length > 0 && (
        <div className='mt-16 pt-10 border-t-2 border-gray-200'>
          <div className='flex justify-between items-center mb-6'>
            <div className='text-xl sm:text-2xl'>
              <Title text1={'SAVED FOR'} text2={'LATER'} />
            </div>
            <span className='text-xs sm:text-sm text-gray-500 font-medium'>
              {savedForLater.length} {savedForLater.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {savedForLater.map((savedItem, idx) => {
              const product = products.find((p) => p._id.toString() === savedItem._id.toString());
              if (!product) return null;

              return (
                <div key={idx} className='border rounded-lg p-3 bg-white flex flex-col justify-between hover:shadow-md transition shadow-2xs'>
                  <div>
                    <Link to={`/product/${product._id}`}>
                      <img
                        className='w-full aspect-square object-cover rounded-md mb-2 bg-gray-50 hover:scale-102 transition'
                        src={product.image[0]}
                        alt={product.name}
                      />
                    </Link>
                    <Link to={`/product/${product._id}`}>
                      <h4 className='text-sm font-medium text-gray-900 line-clamp-1 hover:underline'>
                        {product.name}
                      </h4>
                    </Link>
                    <div className='flex items-center justify-between mt-1 text-xs text-gray-600'>
                      <span className='font-semibold text-gray-900'>{currency}{product.price}</span>
                      <span className='bg-gray-100 px-2 py-0.5 rounded'>Size: {savedItem.size}</span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 mt-4 pt-3 border-t'>
                    <button
                      onClick={() => moveToCartAction(savedItem._id, savedItem.size)}
                      className='flex-1 bg-black text-white text-xs py-2 rounded font-medium hover:bg-gray-800 transition uppercase'
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => removeSavedForLaterAction(savedItem._id, savedItem.size)}
                      className='text-xs text-red-500 hover:text-red-700 font-medium px-2 py-2'
                      title="Remove from saved items"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
