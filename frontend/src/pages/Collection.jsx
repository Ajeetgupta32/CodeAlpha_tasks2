import React, { useContext, useEffect, useState, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Collection = () => {
  const { products, search, setSearch, showSearch, currency, getProductAverageRating, searchProductsApi } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [sortType, setSortType] = useState('relevant');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState(500);
  const [minRating, setMinRating] = useState(0);
  const [onlyBestsellers, setOnlyBestsellers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const debounceTimerRef = useRef(null);

  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const toggleCategory = (e) => {
    const val = e.target.value;
    setCategory(prev => prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]);
  };

  const toggleSubCategory = (e) => {
    const val = e.target.value;
    setSubCategory(prev => prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]);
  };

  const toggleSize = (size) => {
    setSizes(prev => prev.includes(size) ? prev.filter(item => item !== size) : [...prev, size]);
  };

  const clearAllFilters = () => {
    setCategory([]);
    setSubCategory([]);
    setSizes([]);
    setMinPrice('');
    setMaxPrice(500);
    setMinRating(0);
    setOnlyBestsellers(false);
    setSortType('relevant');
    if (search) setSearch('');
  };

  // End-to-end Backend Query + Client Rating Refinement
  const fetchBackendFilteredProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: (showSearch && search) ? search : '',
        category,
        subCategory,
        sizes,
        minPrice: minPrice !== '' ? minPrice : undefined,
        maxPrice: maxPrice < 500 ? maxPrice : undefined,
        bestseller: onlyBestsellers ? 'true' : undefined,
        sort: sortType
      };

      const result = await searchProductsApi(params);
      if (result && Array.isArray(result.products)) {
        let items = result.products;
        // Apply customer review rating filter on returned set if specified
        if (minRating > 0) {
          items = items.filter(item => {
            const rating = Number(getProductAverageRating(item._id));
            return rating >= minRating;
          });
        }
        setFilterProducts(items);
        setTotalCount(minRating > 0 ? items.length : (result.total || items.length));
      } else {
        // Fallback to local products array if backend search fails
        applyLocalFilter();
      }
    } catch (err) {
      console.warn("Backend search failed, fallback to local filter:", err);
      applyLocalFilter();
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilter = () => {
    let copy = products.slice();

    if (showSearch && search) {
      copy = copy.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category.length > 0) {
      copy = copy.filter(item => category.includes(item.category));
    }

    if (subCategory.length > 0) {
      copy = copy.filter(item => subCategory.includes(item.subCategory));
    }

    if (sizes.length > 0) {
      copy = copy.filter(item => {
        const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
        return sizes.some(s => itemSizes.includes(s));
      });
    }

    if (minPrice !== '' && Number(minPrice) > 0) {
      copy = copy.filter(item => Number(item.price) >= Number(minPrice));
    }

    if (Number(maxPrice) < 500) {
      copy = copy.filter(item => Number(item.price) <= Number(maxPrice));
    }

    if (onlyBestsellers) {
      copy = copy.filter(item => item.bestseller === true);
    }

    if (minRating > 0) {
      copy = copy.filter(item => {
        const rating = Number(getProductAverageRating(item._id));
        return rating >= minRating;
      });
    }

    if (sortType === 'low-high') {
      copy.sort((a, b) => a.price - b.price);
    } else if (sortType === 'high-low') {
      copy.sort((a, b) => b.price - a.price);
    } else if (sortType === 'newest') {
      copy.sort((a, b) => (b.date || 0) - (a.date || 0));
    }

    setFilterProducts(copy);
    setTotalCount(copy.length);
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Debounce search slightly to avoid spamming the database while typing
    debounceTimerRef.current = setTimeout(() => {
      fetchBackendFilteredProducts();
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [category, subCategory, sizes, search, showSearch, products, minPrice, maxPrice, minRating, onlyBestsellers, sortType]);

  const hasActiveFilters = category.length > 0 || subCategory.length > 0 || sizes.length > 0 ||
    (minPrice !== '' && Number(minPrice) > 0) || maxPrice < 500 || minRating > 0 || onlyBestsellers || (showSearch && search);

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
      {/* Filter Sidebar */}
      <div className='min-w-64'>
        <div className='flex items-center justify-between my-2'>
          <p onClick={() => setShowFilter(!showFilter)} className='text-xl flex items-center cursor-pointer gap-2 font-medium'>
            FILTERS
            <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className='text-xs text-red-500 font-semibold hover:underline'
            >
              Clear All
            </button>
          )}
        </div>

        {/* Categories */}
        <div className={`border border-gray-200 rounded p-4 mt-6 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-sm`}>
          <p className='mb-3 text-xs font-bold text-gray-900 tracking-wider uppercase'>CATEGORIES</p>
          <div className='flex flex-col gap-2 text-sm text-gray-600'>
            {['Men', 'Women', 'Kids'].map((cat) => (
              <label key={cat} className='flex items-center gap-2 cursor-pointer hover:text-black'>
                <input
                  className='rounded border-gray-300 accent-black'
                  type="checkbox"
                  value={cat}
                  checked={category.includes(cat)}
                  onChange={toggleCategory}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Type / SubCategory */}
        <div className={`border border-gray-200 rounded p-4 my-4 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-sm`}>
          <p className='mb-3 text-xs font-bold text-gray-900 tracking-wider uppercase'>TYPE</p>
          <div className='flex flex-col gap-2 text-sm text-gray-600'>
            {['Topwear', 'Bottomwear', 'Winterwear'].map((sub) => (
              <label key={sub} className='flex items-center gap-2 cursor-pointer hover:text-black'>
                <input
                  className='rounded border-gray-300 accent-black'
                  type="checkbox"
                  value={sub}
                  checked={subCategory.includes(sub)}
                  onChange={toggleSubCategory}
                />
                <span>{sub}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sizes Multi-Select Filter */}
        <div className={`border border-gray-200 rounded p-4 my-4 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-sm`}>
          <p className='mb-3 text-xs font-bold text-gray-900 tracking-wider uppercase'>SIZES</p>
          <div className='flex flex-wrap gap-2'>
            {availableSizes.map((size) => {
              const isSelected = sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dual Price Range Filter */}
        <div className={`border border-gray-200 rounded p-4 my-4 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-sm`}>
          <div className='flex justify-between items-center mb-2'>
            <p className='text-xs font-bold text-gray-900 tracking-wider uppercase'>PRICE RANGE</p>
            <span className='text-xs font-semibold text-black bg-gray-100 px-2 py-0.5 rounded'>
              {currency}{minPrice || 0} - {currency}{maxPrice}
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="500"
            step="10"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className='w-full accent-black cursor-pointer'
          />
          <div className='flex items-center justify-between gap-2 mt-3 text-xs'>
            <div className='flex items-center gap-1 border border-gray-300 rounded px-2 py-1'>
              <span className='text-gray-400'>{currency}</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className='w-14 outline-none text-gray-800'
              />
            </div>
            <span className='text-gray-400'>to</span>
            <div className='flex items-center gap-1 border border-gray-300 rounded px-2 py-1'>
              <span className='text-gray-400'>{currency}</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className='w-14 outline-none text-gray-800'
              />
            </div>
          </div>
        </div>

        {/* Minimum Customer Rating Filter */}
        <div className={`border border-gray-200 rounded p-4 my-4 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-sm`}>
          <p className='mb-3 text-xs font-bold text-gray-900 tracking-wider uppercase'>CUSTOMER RATING</p>
          <div className='flex flex-col gap-2 text-sm text-gray-600'>
            {[
              { label: 'All Ratings', value: 0 },
              { label: '4★ & above', value: 4 },
              { label: '4.5★ & above', value: 4.5 }
            ].map((r) => (
              <label key={r.value} className='flex items-center gap-2 cursor-pointer hover:text-black'>
                <input
                  type="radio"
                  name="ratingFilter"
                  checked={minRating === r.value}
                  onChange={() => setMinRating(r.value)}
                  className='accent-black'
                />
                <span className={minRating === r.value ? 'font-semibold text-black' : ''}>{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bestseller Toggle */}
        <div className={`border border-gray-200 rounded p-4 my-4 ${showFilter ? '' : 'hidden'} sm:block bg-white shadow-sm`}>
          <label className='flex items-center justify-between cursor-pointer'>
            <span className='text-xs font-bold text-gray-900 tracking-wider uppercase'>Bestsellers Only</span>
            <input
              type="checkbox"
              checked={onlyBestsellers}
              onChange={(e) => setOnlyBestsellers(e.target.checked)}
              className='accent-black w-4 h-4 rounded cursor-pointer'
            />
          </label>
        </div>
      </div>

      {/* Products Grid Section */}
      <div className='flex-1'>
        {/* Header and Sorting */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-base sm:text-2xl mb-4'>
          <div>
            <Title text1={'ALL'} text2={'COLLECTIONS'} />
            <p className='text-xs text-gray-500 mt-1 font-normal'>
              Showing {filterProducts.length} of {products.length} products {loading && <span className='text-blue-500 font-medium ml-2 animate-pulse'>Updating...</span>}
            </p>
          </div>

          {/* Product Sorting */}
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className='border border-gray-300 text-sm px-3 py-2 rounded focus:outline-none focus:border-black bg-white cursor-pointer shadow-sm'
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>

        {/* Active Filter Pills Bar */}
        {hasActiveFilters && (
          <div className='flex flex-wrap items-center gap-2 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200'>
            <span className='text-xs font-semibold text-gray-600 mr-1'>Active Filters:</span>
            {showSearch && search && (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 shadow-2xs'>
                Search: "{search}"
                <button onClick={() => setSearch('')} className='text-gray-400 hover:text-black font-bold'>✕</button>
              </span>
            )}
            {category.map(cat => (
              <span key={cat} className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 shadow-2xs'>
                {cat}
                <button onClick={() => toggleCategory({ target: { value: cat } })} className='text-gray-400 hover:text-black font-bold'>✕</button>
              </span>
            ))}
            {subCategory.map(sub => (
              <span key={sub} className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 shadow-2xs'>
                {sub}
                <button onClick={() => toggleSubCategory({ target: { value: sub } })} className='text-gray-400 hover:text-black font-bold'>✕</button>
              </span>
            ))}
            {sizes.map(s => (
              <span key={s} className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 shadow-2xs'>
                Size: {s}
                <button onClick={() => toggleSize(s)} className='text-gray-400 hover:text-black font-bold'>✕</button>
              </span>
            ))}
            {(minPrice !== '' || maxPrice < 500) && (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 shadow-2xs'>
                {currency}{minPrice || 0} - {currency}{maxPrice}
                <button onClick={() => { setMinPrice(''); setMaxPrice(500); }} className='text-gray-400 hover:text-black font-bold'>✕</button>
              </span>
            )}
            {onlyBestsellers && (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 shadow-2xs'>
                Bestseller
                <button onClick={() => setOnlyBestsellers(false)} className='text-gray-400 hover:text-black font-bold'>✕</button>
              </span>
            )}
            {minRating > 0 && (
              <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 shadow-2xs'>
                ★ {minRating}+
                <button onClick={() => setMinRating(0)} className='text-gray-400 hover:text-black font-bold'>✕</button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className='text-xs text-red-600 font-semibold hover:underline ml-auto'
            >
              Clear All
            </button>
          </div>
        )}

        {/* Map Products */}
        {loading && filterProducts.length === 0 ? (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className='animate-pulse bg-gray-100 rounded-lg p-3 h-64 flex flex-col justify-end'>
                <div className='bg-gray-200 h-4 w-3/4 mb-2 rounded'></div>
                <div className='bg-gray-200 h-4 w-1/2 rounded'></div>
              </div>
            ))}
          </div>
        ) : filterProducts.length === 0 ? (
          <div className='text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200'>
            <p className='text-gray-700 text-base font-medium mb-1'>No products match your current filters.</p>
            <p className='text-gray-400 text-xs mb-4'>Try broadening your search term or adjusting size and price filters.</p>
            <button
              onClick={clearAllFilters}
              className='text-sm bg-black text-white px-5 py-2 rounded font-medium hover:bg-gray-800 transition'
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            {filterProducts.map((item, index) => (
              <ProductItem
                key={item._id || index}
                name={item.name}
                id={item._id}
                price={item.price}
                image={item.image}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
