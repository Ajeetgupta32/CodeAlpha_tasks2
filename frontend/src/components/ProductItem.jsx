import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';

const resolveImageUrl = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop';
    if (Array.isArray(img)) {
        const first = img.find(Boolean);
        if (first) {
            return typeof first === 'string' ? first : (first.secure_url || first.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop');
        }
    }
    if (typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed.startsWith('http')) return trimmed;
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed) && parsed[0]) return typeof parsed[0] === 'string' ? parsed[0] : (parsed[0].secure_url || parsed[0].url);
            if (typeof parsed === 'string' && parsed.startsWith('http')) return parsed;
        } catch (_) {}
    }
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop';
};

const ProductItem = ({ id, image, name, price, rating: propRating }) => {
    const { currency, wishlist, toggleWishlist, getProductAverageRating, compareList, addToCompare, removeFromCompare } = useContext(ShopContext);

    const isFav = wishlist.includes(id?.toString());
    const inCompare = compareList?.includes(id?.toString());
    const rating = propRating || getProductAverageRating(id);

    const handleWishlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(id);
    };

    const handleCompareClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inCompare) {
            removeFromCompare(id);
        } else {
            addToCompare(id);
        }
    };

    const displayImage = resolveImageUrl(image);

    return (
        <div className='relative group text-gray-700 bg-white rounded-lg p-2 border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-300'>
            {/* Compare Button */}
            <button
                onClick={handleCompareClick}
                title={inCompare ? "Remove from compare" : "Add to compare"}
                className={`absolute top-3.5 left-3.5 z-10 px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-md shadow-xs transition-all duration-200 ${
                    inCompare
                        ? 'bg-black text-white scale-105'
                        : 'bg-white/85 text-gray-600 hover:bg-white hover:text-black opacity-0 group-hover:opacity-100 sm:opacity-0'
                }`}
            >
                {inCompare ? "✓ Compare" : "+ Compare"}
            </button>

            {/* Wishlist Heart Toggle */}
            <button
                onClick={handleWishlistClick}
                title={isFav ? "Remove from wishlist" : "Add to wishlist"}
                className={`absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full backdrop-blur-md shadow-xs transition-all duration-200 ${
                    isFav
                        ? 'bg-white text-red-500 scale-105'
                        : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
                }`}
            >
                <svg className='w-4 h-4' fill={isFav ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            </button>

            <Link onClick={() => scrollTo(0, 0)} className='cursor-pointer block' to={`/product/${id}`}>
                <div className='overflow-hidden rounded-md bg-gray-50 aspect-square flex items-center justify-center'>
                    <img
                        className='w-full h-full object-cover group-hover:scale-105 transition ease-in-out duration-300'
                        src={displayImage}
                        alt={name}
                        loading="lazy"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop';
                        }}
                    />
                </div>
                <div className='pt-3 pb-1'>
                    <div className='flex items-center justify-between text-xs mb-1'>
                        <div className='flex items-center gap-1 text-amber-500'>
                            <span>★</span>
                            <span className='font-bold text-gray-700'>{rating}</span>
                        </div>
                        <span className='text-[10px] text-green-700 font-medium bg-green-50 px-1.5 py-0.2 rounded'>Free Delivery</span>
                    </div>
                    <p className='text-xs sm:text-sm text-gray-800 line-clamp-1 font-medium group-hover:text-black transition-colors'>{name}</p>
                    <p className='text-sm sm:text-base font-bold text-gray-900 mt-1'>{currency}{price}</p>
                </div>
            </Link>
        </div>
    );
};

export default ProductItem;
