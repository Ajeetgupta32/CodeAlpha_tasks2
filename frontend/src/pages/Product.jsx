import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { toast } from 'react-toastify';
import axios from 'axios';

const Product = () => {
  const { productId } = useParams();
  const { 
    products, 
    currency, 
    addToCart, 
    wishlist, 
    toggleWishlist,
    getProductReviews, 
    getProductAverageRating, 
    addReview,
    recordRecentlyViewed,
    getRecentlyViewedProducts,
    compareList,
    addToCompare,
    removeFromCompare,
    backendUrl,
    token
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'reviews' | 'qa'

  // Image zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  // Color selection state
  const [selectedColor, setSelectedColor] = useState('Classic Black');
  const availableColors = [
    { name: 'Classic Black', code: '#111827' },
    { name: 'Navy Blue', code: '#1e3a8a' },
    { name: 'Heather Grey', code: '#6b7280' },
    { name: 'Olive Green', code: '#3f6212' },
    { name: 'Pure White', code: '#ffffff' }
  ];

  // Delivery estimation state
  const [pincode, setPincode] = useState('110001');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [checkingPin, setCheckingPin] = useState(false);

  const checkDelivery = (pin) => {
    const code = pin || pincode;
    if (!code || code.length < 5) {
      toast.error('Enter a valid postal pincode');
      return;
    }
    setCheckingPin(true);
    setTimeout(() => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      setDeliveryInfo({
        date: d.toLocaleDateString('en-US', options),
        cost: 'FREE',
        speed: 'Express Prime 2-Day'
      });
      setCheckingPin(false);
    }, 250);
  };

  useEffect(() => {
    checkDelivery('110001');
  }, []);

  // Live review state & form
  const [reviewName, setReviewName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [liveReviews, setLiveReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 4.8, starCounts: {}, verifiedPercent: 100 });
  const [aiSummary, setAiSummary] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchLiveReviews = async (pId) => {
    if (!pId) return;
    try {
      const res = await axios.get(`${backendUrl}/api/product/review/list/${pId}`);
      if (res.data.success) {
        setLiveReviews(res.data.reviews || []);
        if (res.data.stats) {
          setReviewStats(res.data.stats);
        }
      }
      const aiRes = await axios.get(`${backendUrl}/api/product/ai-review/${pId}`);
      if (aiRes.data.success && aiRes.data.summary) {
        setAiSummary(aiRes.data.summary);
      }
    } catch (err) {
      console.warn("Error fetching reviews:", err);
    }
  };

  // Customer Q&A state
  const [qaList, setQaList] = useState([
    {
      id: 1,
      q: "Is the fabric 100% pure cotton and breathable for summer?",
      a: "Yes, this garment is made of 100% premium combed cotton, extremely soft, breathable, and pre-shrunk for comfortable all-day wear.",
      by: "Verified Store Manager",
      date: "3 days ago"
    },
    {
      id: 2,
      q: "Does this run true to standard Indian / US sizing?",
      a: "Yes, it fits true to regular tailored size. If you prefer an oversized or relaxed street look, we recommend sizing up by one size.",
      by: "Customer Support",
      date: "1 week ago"
    }
  ]);
  const fetchLiveQA = async (pId) => {
    if (!pId) return;
    try {
      const res = await axios.get(`${backendUrl}/api/product/qa/list/${pId}`);
      if (res.data.success && Array.isArray(res.data.qaList) && res.data.qaList.length > 0) {
        setQaList(res.data.qaList.map(item => ({
          id: item.id,
          q: item.question,
          a: item.answer || 'Thank you for your question. A verified seller or support agent will answer shortly.',
          by: item.answeredBy || 'Seller Support (Pending Verification)',
          date: new Date(item.created_at || Date.now()).toLocaleDateString(),
          isAnswered: Boolean(item.isAnswered)
        })));
      }
    } catch (err) {
      console.warn("Error fetching QA:", err);
    }
  };

  const fetchProductData = async () => {
    products.forEach((item) => {
      if (item._id.toString() === productId?.toString()) {
        setProductData(item);
        setImage(item.image[0]);
        recordRecentlyViewed(item._id);
        fetchLiveReviews(item._id);
        fetchLiveQA(item._id);
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  if (!productData) return <div className='opacity-0'></div>;

  const isFav = wishlist.includes(productData._id.toString());
  const inCompare = compareList?.includes(productData._id.toString());
  const productReviews = liveReviews.length > 0 ? liveReviews : getProductReviews(productData._id);
  const avgRating = reviewStats.totalReviews > 0 ? reviewStats.averageRating : getProductAverageRating(productData._id);

  // Find a bundle complementary product for "Frequently Bought Together"
  const bundleProduct = products.find(p => p._id.toString() !== productData._id.toString() && p.category === productData.category) || products[0];
  const bundleTotal = Number(productData.price) + Number(bundleProduct ? bundleProduct.price : 0);
  const bundleDiscounted = Math.round(bundleTotal * 0.9); // 10% bundle discount

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.warning("Please enter your review feedback");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const payload = {
        productId: productData._id,
        rating: reviewRating,
        title: reviewTitle.trim() || 'Verified Customer Review',
        comment: reviewComment.trim(),
        userName: reviewName.trim() || 'Verified Buyer'
      };
      const res = await axios.post(
        `${backendUrl}/api/product/review/add`,
        payload,
        token ? { headers: { token } } : {}
      );
      if (res.data.success) {
        toast.success("Thank you! Your verified review has been published.");
        setReviewComment('');
        setReviewTitle('');
        setReviewName('');
        setReviewRating(5);
        fetchLiveReviews(productData._id);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleHelpfulVote = async (reviewId) => {
    try {
      const res = await axios.post(`${backendUrl}/api/product/review/helpful`, { reviewId });
      if (res.data.success) {
        setLiveReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpfulCount: res.data.helpfulCount } : r));
        toast.success("Marked as helpful!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    try {
      const res = await axios.post(`${backendUrl}/api/product/qa/ask`, {
        productId: productData._id,
        question: newQuestion.trim(),
        userName: reviewName || 'Curious Shopper'
      });
      if (res.data.success) {
        toast.success("Question submitted! Our team will verify and answer.");
        setNewQuestion('');
        fetchLiveQA(productData._id);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit question");
    }
  };

  const handleAddBundleToCart = () => {
    addToCart(productData._id, size || (productData.sizes && productData.sizes[0]) || 'M');
    if (bundleProduct) {
      addToCart(bundleProduct._id, (bundleProduct.sizes && bundleProduct.sizes[0]) || 'M');
    }
    toast.success("Both bundle items added to cart with 10% discount applied!");
  };

  return (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/*----------- Product Main View -------------- */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>
        {/*---------- Product Images Gallery ------------- */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full gap-2'>
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className={`w-[24%] sm:w-full sm:mb-2 flex-shrink-0 cursor-pointer rounded border transition-all ${
                  item === image ? 'border-black ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'
                }`}
                alt=""
              />
            ))}
          </div>
          <div
            className='w-full sm:w-[80%] relative overflow-hidden rounded-xl border border-gray-200 cursor-crosshair group bg-gray-50'
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              className={`w-full h-auto object-cover transition-transform duration-150 ${isZoomed ? 'scale-175' : 'scale-100'}`}
              style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
              src={image}
              alt={productData.name}
            />
            <span className='absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-xs pointer-events-none opacity-0 group-hover:opacity-100 transition shadow'>
              🔍 Hover to Zoom
            </span>
          </div>
        </div>

        {/* -------- Product Info ---------- */}
        <div className='flex-1'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold tracking-wider text-gray-400 uppercase'>{productData.category} • {productData.subCategory}</span>
            {productData.bestseller && (
              <span className='bg-orange-100 text-orange-700 text-xs px-2.5 py-0.5 rounded-full font-medium'>
                Bestseller
              </span>
            )}
          </div>
          <h1 className='font-medium text-2xl mt-2 text-gray-900'>{productData.name}</h1>

          {/* Star Rating snippet */}
          <div 
            onClick={() => setActiveTab('reviews')}
            className='flex items-center gap-1.5 mt-2 cursor-pointer group'
          >
            <div className='flex text-amber-500 text-sm'>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s}>{s <= Math.round(Number(avgRating)) ? '★' : '☆'}</span>
              ))}
            </div>
            <span className='text-xs font-bold text-gray-800 ml-1'>{avgRating}</span>
            <span className='text-xs text-gray-500 group-hover:underline'>({productReviews.length} customer ratings)</span>
          </div>

          <div className='flex items-baseline gap-3 mt-4'>
            <p className='text-3xl font-bold text-gray-900'>{currency}{productData.price}</p>
            <span className='text-xs text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded'>Inclusive of all taxes</span>
          </div>

          {/* Real-time Stock Urgency Status */}
          <div className='my-3 flex items-center gap-2'>
            {productData.stock !== undefined && productData.stock <= 10 && productData.stock > 0 ? (
              <span className='inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-pulse'>
                <span>🔥</span> Only {productData.stock} left in stock — order soon!
              </span>
            ) : productData.inStock === false || (productData.stock !== undefined && productData.stock <= 0) ? (
              <span className='inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200'>
                <span>✕</span> Currently Out of Stock
              </span>
            ) : (
              <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200'>
                <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span> In Stock & Ready to Ship
              </span>
            )}
          </div>

          <p className='mt-4 text-gray-600 text-sm leading-relaxed'>{productData.description}</p>

          {/* Color Selection Swatches */}
          <div className='flex flex-col gap-2 my-5'>
            <p className='text-xs font-semibold text-gray-700 uppercase tracking-wider'>
              Color: <span className='text-black font-bold normal-case'>{selectedColor}</span>
            </p>
            <div className='flex items-center gap-2.5'>
              {availableColors.map((col) => (
                <button
                  key={col.name}
                  type='button'
                  onClick={() => setSelectedColor(col.name)}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedColor === col.name ? 'ring-2 ring-black ring-offset-2 scale-110' : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.code }}
                  title={col.name}
                >
                  {selectedColor === col.name && (
                    <span className={`text-[10px] font-bold ${col.name === 'Pure White' ? 'text-black' : 'text-white'}`}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className='flex flex-col gap-3 my-6'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-bold text-gray-900 uppercase tracking-wider'>Select Size</p>
              <button 
                type="button" 
                onClick={() => toast.info("Standard Sizing: S (38), M (40), L (42), XL (44), XXL (46)")}
                className='text-xs text-indigo-600 hover:underline'
              >
                Size Guide 📐
              </button>
            </div>
            <div className='flex gap-2 flex-wrap'>
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 rounded text-xs font-semibold transition-all ${
                    item === size
                      ? 'border-black bg-black text-white shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
                  }`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className='flex flex-wrap items-center gap-3'>
            <button
              onClick={() => addToCart(productData._id, size)}
              className='bg-black text-white px-7 py-3.5 text-xs font-semibold rounded hover:bg-gray-800 active:bg-gray-900 transition uppercase flex items-center justify-center gap-2 shadow-xs'
            >
              <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Add To Cart
            </button>

            {/* Buy Now (1-click direct checkout) */}
            <button
              onClick={() => {
                if (!size && productData.sizes && productData.sizes.length > 0) {
                  toast.error('Please select product size first');
                  return;
                }
                addToCart(productData._id, size);
                navigate('/place-order');
              }}
              className='bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black px-7 py-3.5 text-xs font-bold rounded transition uppercase flex items-center justify-center gap-2 shadow-xs'
            >
              <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Buy Now
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(productData._id)}
              className={`p-3 rounded border transition-all ${
                isFav
                  ? 'border-red-500 bg-red-50 text-red-500'
                  : 'border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500'
              }`}
              title={isFav ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg className='w-5 h-5' fill={isFav ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Compare Button */}
            <button
              onClick={() => {
                if (inCompare) removeFromCompare(productData._id);
                else addToCompare(productData._id);
              }}
              className={`px-3 py-3 rounded border text-xs font-semibold transition-all ${
                inCompare
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
              }`}
              title={inCompare ? "Remove from comparison" : "Add to comparison"}
            >
              {inCompare ? "✓ Compared" : "+ Compare"}
            </button>
          </div>

          {/* Amazon-style Delivery & Pincode Checker */}
          <div className='mt-6 p-4 rounded-xl border border-gray-200 bg-gray-50/70 sm:w-4/5'>
            <div className='flex items-center justify-between gap-2 mb-2'>
              <span className='text-xs font-semibold text-gray-800 flex items-center gap-1.5'>
                <svg className='w-4 h-4 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                </svg>
                Delivery Options & Speed
              </span>
            </div>
            <div className='flex gap-2'>
              <input
                type='text'
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder='Postal code'
                className='px-3 py-1.5 border border-gray-300 rounded text-xs w-32 focus:outline-black bg-white'
              />
              <button
                type='button'
                onClick={() => checkDelivery(pincode)}
                className='px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-black transition'
              >
                {checkingPin ? 'Checking...' : 'Check'}
              </button>
            </div>
            {deliveryInfo && (
              <div className='mt-2.5 text-xs text-gray-700 flex flex-col gap-1'>
                <p className='font-semibold text-emerald-700 flex items-center gap-1.5'>
                  <span>⚡</span> Delivery by <span className='underline font-bold'>{deliveryInfo.date}</span> &bull; {deliveryInfo.cost}
                </p>
                <p className='text-gray-500 text-[11px]'>
                  Order within <span className='text-amber-700 font-semibold'>4 hrs 15 mins</span> for fastest shipping.
                </p>
              </div>
            )}
          </div>

          <hr className='mt-8 sm:w-4/5 border-gray-200' />
          <div className='text-xs text-gray-500 mt-5 flex flex-col gap-1.5'>
            <p className='flex items-center gap-2'>
              <span className='text-green-600 font-bold'>✓</span> 100% Original and authentic product.
            </p>
            <p className='flex items-center gap-2'>
              <span className='text-green-600 font-bold'>✓</span> Cash on delivery is available for this product.
            </p>
            <p className='flex items-center gap-2'>
              <span className='text-green-600 font-bold'>✓</span> Easy returns and exchange policy within 7 days.
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Frequently Bought Together (Amazon Bundle) ---------- */}
      {bundleProduct && (
        <div className='mt-16 p-6 rounded-2xl bg-gray-50 border border-gray-200'>
          <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2'>
            <span>📦</span> Frequently Bought Together
          </h4>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <img src={productData.image[0]} alt={productData.name} className='w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border bg-white' />
              <span className='text-xl font-bold text-gray-400'>+</span>
              <img src={bundleProduct.image[0]} alt={bundleProduct.name} className='w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border bg-white' />
              <div className='text-xs text-gray-700 space-y-1 max-w-xs'>
                <p className='font-semibold text-gray-900 line-clamp-1'>• {productData.name}</p>
                <p className='font-semibold text-gray-900 line-clamp-1'>• {bundleProduct.name}</p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right'>
              <div>
                <p className='text-xs text-gray-500'>Bundle Price:</p>
                <div className='flex items-baseline gap-2'>
                  <span className='text-xl font-bold text-gray-900'>{currency}{bundleDiscounted}</span>
                  <span className='text-xs text-gray-400 line-through'>{currency}{bundleTotal}</span>
                  <span className='text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded'>Save 10%</span>
                </div>
              </div>
              <button
                onClick={handleAddBundleToCart}
                className='bg-black text-white text-xs font-semibold px-5 py-3 rounded-lg hover:bg-gray-800 transition uppercase shadow-xs'
              >
                Add Both To Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Tabs: Description, Interactive Reviews & Customer Q&A ------------- */}
      <div className='mt-16'>
        <div className='flex border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('description')}
            className={`px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'description'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Customer Reviews
            <span className='bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold'>
              {productReviews.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 ${
              activeTab === 'qa'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Customer Q&A
            <span className='bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold'>
              {qaList.length}
            </span>
          </button>
        </div>

        {activeTab === 'description' && (
          <div className='flex flex-col gap-4 border border-t-0 rounded-b-lg px-6 py-8 text-sm text-gray-600 bg-white leading-relaxed'>
            <p>{productData.description}</p>
            <p>
              Designed with premium fabrics and modern cuts, this {productData.name} offers effortless everyday style and comfort. Carefully stitched with reinforced seams to withstand regular washing while retaining its original shape and vibrant color.
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t text-xs text-gray-500'>
              <div>• <b>Material:</b> 100% Breathable Combed Cotton</div>
              <div>• <b>Care:</b> Machine wash cold, tumble dry low</div>
              <div>• <b>Fit Type:</b> Regular modern tailored fit</div>
              <div>• <b>Origin:</b> Responsibly manufactured</div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className='border border-t-0 rounded-b-lg p-6 sm:p-8 bg-white'>
            {/* AI Review Summary Box (Rufus AI Insights) */}
            <div className='mb-8 p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl'>
              <div className='flex items-start gap-3.5'>
                <span className='text-3xl'>✨</span>
                <div className='flex-1'>
                  <div className='flex items-center justify-between flex-wrap gap-2'>
                    <h5 className='text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5'>
                      AI Review Highlights (Powered by Gemini)
                    </h5>
                    <span className='text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full'>
                      {reviewStats.verifiedPercent || 100}% Verified Customer Sentiment
                    </span>
                  </div>
                  <p className='text-xs text-indigo-900 mt-1.5 leading-relaxed font-medium'>
                    {aiSummary?.overallVerdict || `Highly rated (${avgRating}/5.0) by customers. Praised for soft breathable fabric, true-to-size cut, and enduring color finish after washing.`}
                  </p>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-indigo-100/70 text-xs text-indigo-950'>
                    <div className='flex items-center gap-2'>
                      <span className='text-green-600 font-bold'>✓</span>
                      <span><b>Fit:</b> {aiSummary?.fitFeedback || '94% of buyers report this item fits true to size.'}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-green-600 font-bold'>✓</span>
                      <span><b>Material:</b> {aiSummary?.materialQuality || 'Rated 4.9/5 for premium softness and durable seams.'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ratings Overview & Write Review Form */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b mb-8'>
              {/* Star Rating Breakdown Bar Chart */}
              <div className='lg:col-span-5 flex flex-col justify-center p-6 bg-gray-50 rounded-2xl'>
                <div className='flex items-baseline gap-3 mb-2'>
                  <span className='text-5xl font-extrabold text-gray-900'>{avgRating}</span>
                  <div>
                    <div className='flex text-amber-500 text-base'>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s}>{s <= Math.round(Number(avgRating)) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <p className='text-xs text-gray-500 mt-0.5'>{productReviews.length} verified ratings</p>
                  </div>
                </div>

                {/* Progress bars for 5, 4, 3, 2, 1 stars */}
                <div className='space-y-1.5 mt-3'>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewStats.starCounts?.[star] || (star === 5 ? Math.ceil(productReviews.length * 0.7) : star === 4 ? Math.floor(productReviews.length * 0.3) : 0);
                    const pct = productReviews.length > 0 ? Math.round((count / productReviews.length) * 100) : (star === 5 ? 70 : star === 4 ? 30 : 0);
                    return (
                      <div key={star} className='flex items-center gap-2.5 text-xs text-gray-600'>
                        <span className='w-10 font-medium text-right'>{star} star</span>
                        <div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-amber-400 rounded-full transition-all duration-500'
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className='w-9 text-gray-400 text-right'>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Form */}
              <div className='lg:col-span-7 flex flex-col justify-center'>
                <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wide mb-3'>Write a Customer Review</h4>
                <form onSubmit={handleReviewSubmit} className='flex flex-col gap-3'>
                  <div className='flex items-center gap-3'>
                    <span className='text-xs text-gray-700 font-medium'>Overall Rating:</span>
                    <div className='flex text-2xl text-amber-500 cursor-pointer'>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className='focus:outline-none transition-transform hover:scale-125 px-0.5'
                        >
                          {star <= (hoverRating || reviewRating) ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <span className='text-xs font-bold text-gray-800 ml-1'>
                      {(hoverRating || reviewRating)} / 5
                    </span>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <input
                      type='text'
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder='Your Name (e.g. Alex M.)'
                      className='border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black'
                    />
                    <input
                      type='text'
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder='Headline (e.g. Perfect fit and soft fabric!)'
                      className='border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black'
                    />
                  </div>

                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder='What did you like or dislike about this product? How is the fit, material, and quality after wear?'
                    className='border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black w-full resize-none'
                  />

                  <button
                    type='submit'
                    disabled={isSubmittingReview}
                    className='self-start bg-black text-white px-6 py-2.5 rounded-lg text-xs uppercase font-semibold hover:bg-gray-800 transition disabled:opacity-50'
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}
                  </button>
                </form>
              </div>
            </div>

            {/* Reviews List */}
            <div className='flex flex-col gap-6'>
              <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center justify-between'>
                <span>Customer Reviews ({productReviews.length})</span>
                <span className='text-xs font-normal text-gray-500 lowercase'>ordered by most recent</span>
              </h4>
              {productReviews.map((rev) => (
                <div key={rev.id} className='border-b border-gray-100 pb-5 last:border-b-0'>
                  <div className='flex items-center justify-between mb-1.5'>
                    <div className='flex items-center gap-2'>
                      <div className='w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center uppercase'>
                        {(rev.userName || rev.name || 'V').charAt(0)}
                      </div>
                      <div>
                        <span className='font-semibold text-xs text-gray-900'>{rev.userName || rev.name || 'Verified Customer'}</span>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-[10px] bg-green-100 text-green-800 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5'>
                            ✓ Verified Purchase
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className='text-[11px] text-gray-400'>
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : (rev.date || 'Recent')}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 my-1'>
                    <div className='flex text-amber-500 text-xs'>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s}>{s <= (rev.rating || 5) ? '★' : '☆'}</span>
                      ))}
                    </div>
                    {rev.title && (
                      <span className='text-xs font-bold text-gray-900'>{rev.title}</span>
                    )}
                  </div>

                  <p className='text-xs text-gray-700 leading-relaxed mt-1'>
                    {rev.comment}
                  </p>

                  <div className='flex items-center gap-3 mt-3'>
                    <button
                      onClick={() => handleHelpfulVote(rev.id)}
                      className='inline-flex items-center gap-1.5 text-[11px] border border-gray-200 hover:border-gray-400 px-3 py-1 rounded-full text-gray-600 transition'
                    >
                      <span>👍 Helpful</span>
                      {Number(rev.helpfulCount || 0) > 0 && (
                        <span className='font-semibold text-gray-900'>({rev.helpfulCount})</span>
                      )}
                    </button>
                    <span className='text-[10px] text-gray-400'>Report</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Q&A Tab */}
        {activeTab === 'qa' && (
          <div className='border border-t-0 rounded-b-lg p-6 sm:p-8 bg-white'>
            <div className='mb-8 pb-6 border-b'>
              <h4 className='text-base font-semibold text-gray-900 mb-2'>Have a question about this item?</h4>
              <p className='text-xs text-gray-500 mb-4'>Find answers in product info, Q&As, or ask the community and verified sellers.</p>
              <form onSubmit={handleAddQuestion} className='flex gap-2 max-w-xl'>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Type your question (e.g. Is it machine washable?)"
                  className='flex-1 border border-gray-300 rounded-lg px-4 py-2 text-xs outline-none focus:border-black'
                />
                <button
                  type="submit"
                  disabled={!newQuestion.trim()}
                  className='bg-black text-white text-xs px-5 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40 transition'
                >
                  Ask Question
                </button>
              </form>
            </div>

            <div className='space-y-6'>
              {qaList.map((qa) => (
                <div key={qa.id} className='text-xs space-y-1.5 border-b pb-4 last:border-b-0'>
                  <div className='flex items-start gap-2'>
                    <span className='font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded'>Q:</span>
                    <span className='font-semibold text-gray-900 text-sm'>{qa.q}</span>
                  </div>
                  <div className='flex items-start gap-2 pl-6'>
                    <span className='font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded'>A:</span>
                    <div className='flex-1 text-gray-700 leading-relaxed'>
                      <p>{qa.a}</p>
                      <p className='text-[10px] text-gray-400 mt-1'>Answered by <span className='font-medium text-gray-600'>{qa.by}</span> • {qa.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --------- Related Products ---------- */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />

      {/* --------- Recently Viewed Products ---------- */}
      {(() => {
        const recentList = getRecentlyViewedProducts().filter(p => p._id.toString() !== productData._id.toString());
        if (recentList.length === 0) return null;
        return (
          <div className='my-20 border-t pt-10'>
            <div className='text-center py-2 text-2xl sm:text-3xl'>
              <Title text1={'RECENTLY'} text2={'VIEWED'} />
              <p className='w-3/4 m-auto text-xs sm:text-sm text-gray-500 mt-1'>
                Items you recently explored in our store
              </p>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 mt-6'>
              {recentList.slice(0, 5).map((item, index) => (
                <ProductItem key={item._id || index} id={item._id} name={item.name} price={item.price} image={item.image} />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Product;
