import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Wishlist = () => {
    const { products, currency, wishlist, toggleWishlist, addToCart, getProductAverageRating } = useContext(ShopContext);

    const wishlistProducts = products.filter(product => wishlist.includes(product._id.toString()));

    const handleAddAllToCart = () => {
        if (wishlistProducts.length === 0) return;
        wishlistProducts.forEach(item => {
            const defaultSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'M';
            addToCart(item._id, defaultSize);
        });
        toast.success(`Added all ${wishlistProducts.length} wishlist items to your cart!`);
    };

    return (
        <div className='border-t pt-14 min-h-[70vh]'>
            <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 pb-4 border-b border-gray-100'>
                <div>
                    <div className='text-2xl'>
                        <Title text1={'YOUR'} text2={'WISHLIST'} />
                    </div>
                    {wishlistProducts.length > 0 && (
                        <span className='text-xs text-gray-500 font-medium'>
                            {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved for later
                        </span>
                    )}
                </div>

                {wishlistProducts.length > 0 && (
                    <button
                        onClick={handleAddAllToCart}
                        className='px-4 py-2 bg-black text-white rounded text-xs font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-xs'
                    >
                        <span>🛒 Move All to Cart</span>
                    </button>
                )}
            </div>

            {wishlistProducts.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-20 text-center'>
                    <div className='w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-400 mb-4'>
                        <svg className='w-10 h-10' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3 className='text-xl font-medium text-gray-800 mb-2'>Your wishlist is empty</h3>
                    <p className='text-gray-500 max-w-sm mb-6 text-sm'>
                        Explore our latest fashion collections and click the heart icon on any item to save your favorites here.
                    </p>
                    <Link to='/collection' className='bg-black text-white px-8 py-3 text-sm hover:bg-gray-800 transition-colors uppercase'>
                        Explore Collection
                    </Link>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                    {wishlistProducts.map((item) => {
                        const rating = getProductAverageRating(item._id);
                        const defaultSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'M';
                        const isLowStock = item.stock !== undefined && item.stock <= 10 && item.stock > 0;
                        const isOutOfStock = item.inStock === false || (item.stock !== undefined && item.stock <= 0);

                        return (
                            <div key={item._id} className='border rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative bg-white'>
                                <button
                                    onClick={() => toggleWishlist(item._id)}
                                    title="Remove from wishlist"
                                    className='absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-sm hover:scale-110 transition-transform z-10'
                                >
                                    <svg className='w-5 h-5 fill-current' viewBox="0 0 24 24">
                                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>

                                <Link to={`/product/${item._id}`} className='overflow-hidden rounded-lg mb-3 aspect-square block bg-gray-50 relative group'>
                                    <img
                                        src={Array.isArray(item.image) ? item.image[0] : item.image}
                                        alt={item.name}
                                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                                    />
                                    {/* Price drop badge */}
                                    <span className='absolute bottom-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow'>
                                        ⚡ Limited Deal
                                    </span>
                                </Link>

                                <div>
                                    <div className='flex items-center justify-between text-xs mb-1'>
                                        <span className='text-amber-500 font-semibold'>★ {rating}</span>
                                        {/* Stock indicator badge */}
                                        {isOutOfStock ? (
                                            <span className='text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-bold'>
                                                Out of Stock
                                            </span>
                                        ) : isLowStock ? (
                                            <span className='text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-bold'>
                                                Only {item.stock} left
                                            </span>
                                        ) : (
                                            <span className='text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold'>
                                                In Stock
                                            </span>
                                        )}
                                    </div>

                                    <Link to={`/product/${item._id}`}>
                                        <h4 className='font-medium text-gray-800 text-sm hover:underline line-clamp-1 mb-1'>
                                            {item.name}
                                        </h4>
                                    </Link>
                                    <p className='text-gray-900 font-bold mb-3'>
                                        {currency}{item.price}
                                    </p>
                                </div>

                                <div className='flex gap-2 pt-2 border-t'>
                                    <button
                                        onClick={() => {
                                            if (isOutOfStock) {
                                                toast.error("This item is currently out of stock");
                                                return;
                                            }
                                            addToCart(item._id, defaultSize);
                                            toggleWishlist(item._id);
                                        }}
                                        disabled={isOutOfStock}
                                        className={`flex-1 text-xs py-2.5 rounded transition-colors uppercase font-medium flex items-center justify-center gap-1.5 ${
                                            isOutOfStock
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-black text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        Move To Cart ({defaultSize})
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
