import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { translations } from "../utils/translations";

export const ShopContext = createContext();

const AVAILABLE_COUPONS = {
  WELCOME10: { type: 'percent', value: 10, description: '10% OFF on all orders' },
  SAVE20: { type: 'percent', value: 20, description: '20% OFF on your purchase' },
  FLAT50: { type: 'flat', value: 50, description: '$50 Flat discount on orders above $100', minOrder: 100 }
};

const DEFAULT_REVIEWS = {
  "default": [
    {
      id: "r1",
      name: "Sophia Martinez",
      rating: 5,
      comment: "Absolutely in love with the quality! Fabric feels premium and fits true to size.",
      date: "2 days ago"
    },
    {
      id: "r2",
      name: "Liam Johnson",
      rating: 4,
      comment: "Great material and comfortable wear. Delivery was fast and well packed.",
      date: "1 week ago"
    }
  ]
};

const ShopContextProvider = (props) => {
    const currency = '$';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('');
    const navigate = useNavigate();

    // 1. Wishlist state (persisted in localStorage + PostgreSQL when logged in)
    const [wishlist, setWishlist] = useState(() => {
        try {
            const saved = localStorage.getItem('wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // 2. Recently Viewed products (persisted in localStorage + PostgreSQL when logged in)
    const [recentlyViewed, setRecentlyViewed] = useState(() => {
        try {
            const saved = localStorage.getItem('recently_viewed');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // 3. Saved for Later items in cart (persisted in localStorage + PostgreSQL when logged in)
    const [savedForLater, setSavedForLater] = useState(() => {
        try {
            const saved = localStorage.getItem('saved_for_later');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Coupon state
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [liveCoupons, setLiveCoupons] = useState(AVAILABLE_COUPONS);

    useEffect(() => {
        const fetchActiveCoupons = async () => {
            try {
                const res = await axios.get(backendUrl + '/api/admin/coupons/active');
                if (res.data.success && Array.isArray(res.data.coupons)) {
                    const map = { ...AVAILABLE_COUPONS };
                    res.data.coupons.forEach(c => {
                        map[c.code] = {
                            type: c.type,
                            value: Number(c.value),
                            description: c.description,
                            minOrder: Number(c.minOrder || 0)
                        };
                    });
                    setLiveCoupons(map);
                }
            } catch (e) {
                // Keep local defaults
            }
        };
        fetchActiveCoupons();
    }, [backendUrl]);

    // Reviews state (persisted in localStorage)
    const [reviews, setReviews] = useState(() => {
        try {
            const saved = localStorage.getItem('product_reviews');
            return saved ? JSON.parse(saved) : DEFAULT_REVIEWS;
        } catch {
            return DEFAULT_REVIEWS;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        } catch (e) {
            console.error('Error saving wishlist:', e);
        }
    }, [wishlist]);

    useEffect(() => {
        try {
            localStorage.setItem('recently_viewed', JSON.stringify(recentlyViewed));
        } catch (e) {
            console.error('Error saving recently_viewed:', e);
        }
    }, [recentlyViewed]);

    useEffect(() => {
        try {
            localStorage.setItem('saved_for_later', JSON.stringify(savedForLater));
        } catch (e) {
            console.error('Error saving saved_for_later:', e);
        }
    }, [savedForLater]);

    useEffect(() => {
        try {
            localStorage.setItem('product_reviews', JSON.stringify(reviews));
        } catch (e) {
            console.error('Error saving reviews:', e);
        }
    }, [reviews]);

    // Wishlist actions
    const toggleWishlist = async (productId) => {
        if (!productId) return;
        const pIdStr = productId.toString();
        const isIn = wishlist.includes(pIdStr);
        const updated = isIn ? wishlist.filter(id => id !== pIdStr) : [...wishlist, pIdStr];
        setWishlist(updated);
        if (isIn) {
            toast.info("Removed from Wishlist");
        } else {
            toast.success("Added to Wishlist ❤️");
        }

        if (token) {
            try {
                await axios.post(backendUrl + '/api/user/wishlist/toggle', { productId: pIdStr }, { headers: { token } });
            } catch (err) {
                console.error("Wishlist sync error:", err);
            }
        }
    };

    const isInWishlist = (productId) => {
        if (!productId) return false;
        return wishlist.includes(productId.toString());
    };

    const getWishlistCount = () => wishlist.length;

    // Recently viewed actions
    const recordRecentlyViewed = async (productId) => {
        if (!productId) return;
        const pIdStr = productId.toString();
        setRecentlyViewed(prev => {
            const filtered = prev.filter(id => id !== pIdStr);
            return [pIdStr, ...filtered].slice(0, 8);
        });

        if (token) {
            try {
                await axios.post(backendUrl + '/api/user/recent/add', { productId: pIdStr }, { headers: { token } });
            } catch (err) {
                console.error("Recent viewed sync error:", err);
            }
        }
    };

    const getRecentlyViewedProducts = () => {
        return recentlyViewed
            .map(id => products.find(p => p._id.toString() === id.toString()))
            .filter(Boolean);
    };

    // Save for Later actions
    const saveForLaterAction = async (itemId, size) => {
        let cartData = structuredClone(cartItems);
        let qty = 1;
        if (cartData[itemId] && cartData[itemId][size]) {
            qty = cartData[itemId][size];
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
            setCartItems(cartData);
        }

        setSavedForLater(prev => {
            const existingIdx = prev.findIndex(s => s._id.toString() === itemId.toString() && s.size === size);
            if (existingIdx >= 0) {
                const copy = [...prev];
                copy[existingIdx].quantity += qty;
                return copy;
            }
            return [...prev, { _id: itemId.toString(), size, quantity: qty }];
        });
        toast.info("Saved for later");

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/save-for-later', { itemId, size }, { headers: { token } });
            } catch (err) {
                console.error("Save for later sync error:", err);
            }
        }
    };

    const moveToCartAction = async (itemId, size) => {
        let qty = 1;
        setSavedForLater(prev => {
            const item = prev.find(s => s._id.toString() === itemId.toString() && s.size === size);
            if (item) qty = item.quantity || 1;
            return prev.filter(s => !(s._id.toString() === itemId.toString() && s.size === size));
        });

        let cartData = structuredClone(cartItems);
        if (!cartData[itemId]) cartData[itemId] = {};
        if (cartData[itemId][size]) {
            cartData[itemId][size] += qty;
        } else {
            cartData[itemId][size] = qty;
        }
        setCartItems(cartData);
        toast.success("Moved back to cart!");

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/move-to-cart', { itemId, size }, { headers: { token } });
            } catch (err) {
                console.error("Move to cart sync error:", err);
            }
        }
    };

    const removeSavedForLaterAction = async (itemId, size) => {
        setSavedForLater(prev => prev.filter(s => !(s._id.toString() === itemId.toString() && s.size === size)));
        toast.info("Removed from saved items");

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/remove-saved', { itemId, size }, { headers: { token } });
            } catch (err) {
                console.error("Remove saved item sync error:", err);
            }
        }
    };

    // Coupon functions
    const applyCoupon = (code) => {
        if (!code) {
            toast.error("Please enter a coupon code");
            return false;
        }
        const cleanCode = code.trim().toUpperCase();
        const coupon = liveCoupons[cleanCode] || AVAILABLE_COUPONS[cleanCode];
        if (!coupon) {
            toast.error("Invalid coupon code.");
            return false;
        }

        const subtotal = getCartAmount();
        if (coupon.minOrder && subtotal < coupon.minOrder) {
            toast.warning(`This coupon requires a minimum cart value of ${currency}${coupon.minOrder}`);
            return false;
        }

        setAppliedCoupon({ code: cleanCode, ...coupon });
        toast.success(`Coupon "${cleanCode}" applied! ${coupon.description}`);
        return true;
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        toast.info("Coupon removed");
    };

    const getDiscountAmount = () => {
        if (!appliedCoupon) return 0;
        const subtotal = getCartAmount();
        if (appliedCoupon.type === 'percent') {
            return (subtotal * appliedCoupon.value) / 100;
        }
        if (appliedCoupon.type === 'flat') {
            return Math.min(subtotal, appliedCoupon.value);
        }
        return 0;
    };

    const getFinalAmount = () => {
        const subtotal = getCartAmount();
        if (subtotal === 0) return 0;
        const discount = getDiscountAmount();
        return Math.max(0, subtotal - discount) + delivery_fee;
    };

    // Reviews functions
    const addReview = (productId, reviewData) => {
        const pIdStr = productId.toString();
        const newReview = {
            id: 'rev_' + Date.now(),
            name: reviewData.name || 'Anonymous Customer',
            rating: Number(reviewData.rating) || 5,
            comment: reviewData.comment || 'Verified purchase.',
            date: 'Just now'
        };

        setReviews(prev => {
            const list = prev[pIdStr] ? [...prev[pIdStr]] : [...(prev['default'] || [])];
            return {
                ...prev,
                [pIdStr]: [newReview, ...list]
            };
        });
        toast.success("Thank you for your review!");
    };

    const getProductReviews = (productId) => {
        const pIdStr = productId?.toString();
        if (reviews[pIdStr] && reviews[pIdStr].length > 0) {
            return reviews[pIdStr];
        }
        return reviews['default'] || [];
    };

    const getProductAverageRating = (productId) => {
        const list = getProductReviews(productId);
        if (!list || list.length === 0) return 4.8;
        const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
        return (sum / list.length).toFixed(1);
    };

    const addToCart = async (itemId, size) => {
        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);
        toast.success("Added to Cart!");

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } });
            } catch (error) {
                console.log(error);
                toast.error(error.message);
            }
        }
    };

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {}
            }
        }
        return totalCount;
    };

    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } });
            } catch (error) {
                console.log(error);
                toast.error(error.message);
            }
        }
    };

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id.toString() === items.toString());
            if (itemInfo) {
                for (const item in cartItems[items]) {
                    try {
                        if (cartItems[items][item] > 0) {
                            totalAmount += itemInfo.price * cartItems[items][item];
                        }
                    } catch (error) {}
                }
            }
        }
        return totalAmount;
    };

    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list');
            if (response.data.success) {
                setProducts(response.data.products.reverse());
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const getUserCart = async (activeToken) => {
        try {
            const t = activeToken || token;
            if (!t) return;

            // 1. Fetch cart and savedForLater
            const cartRes = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token: t } });
            if (cartRes.data.success) {
                if (cartRes.data.cartData) setCartItems(cartRes.data.cartData);
                if (cartRes.data.savedForLater && cartRes.data.savedForLater.length > 0) {
                    setSavedForLater(cartRes.data.savedForLater);
                }
            }

            // 2. Fetch wishlist
            const wishRes = await axios.post(backendUrl + '/api/user/wishlist/get', {}, { headers: { token: t } });
            if (wishRes.data.success && Array.isArray(wishRes.data.wishlist) && wishRes.data.wishlist.length > 0) {
                setWishlist(wishRes.data.wishlist);
            }

            // 3. Fetch recently viewed
            const recentRes = await axios.post(backendUrl + '/api/user/recent/get', {}, { headers: { token: t } });
            if (recentRes.data.success && Array.isArray(recentRes.data.recentlyViewed) && recentRes.data.recentlyViewed.length > 0) {
                setRecentlyViewed(recentRes.data.recentlyViewed);
            }
        } catch (error) {
            console.log("Error syncing user profile data:", error);
        }
    };

    const searchProductsApi = async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.search) queryParams.set('search', params.search);
            if (params.category && params.category.length > 0) {
                queryParams.set('category', Array.isArray(params.category) ? params.category.join(',') : params.category);
            }
            if (params.subCategory && params.subCategory.length > 0) {
                queryParams.set('subCategory', Array.isArray(params.subCategory) ? params.subCategory.join(',') : params.subCategory);
            }
            if (params.sizes && params.sizes.length > 0) {
                queryParams.set('sizes', Array.isArray(params.sizes) ? params.sizes.join(',') : params.sizes);
            }
            if (params.minPrice !== undefined && params.minPrice !== null && params.minPrice !== '') {
                queryParams.set('minPrice', params.minPrice);
            }
            if (params.maxPrice !== undefined && params.maxPrice !== null && params.maxPrice !== '') {
                queryParams.set('maxPrice', params.maxPrice);
            }
            if (params.bestseller) {
                queryParams.set('bestseller', 'true');
            }
            if (params.sort) {
                queryParams.set('sort', params.sort);
            }
            if (params.page) {
                queryParams.set('page', params.page);
            }
            if (params.limit) {
                queryParams.set('limit', params.limit);
            }

            const queryString = queryParams.toString();
            const url = `${backendUrl}/api/product/search${queryString ? `?${queryString}` : ''}`;
            const response = await axios.get(url);
            if (response.data.success) {
                return response.data;
            }
            return { products: [], total: 0, facets: {} };
        } catch (error) {
            console.error('Search API error:', error);
            return null;
        }
    };

    useEffect(() => {
        getProductsData();
    }, []);

    useEffect(() => {
        if (!token && localStorage.getItem('token')) {
            const savedToken = localStorage.getItem('token');
            setToken(savedToken);
            getUserCart(savedToken);
        }
        if (token) {
            getUserCart(token);
        }
    }, [token]);

    // Product Comparison
    const [compareList, setCompareList] = useState(() => {
        try {
            const saved = localStorage.getItem('compare_list');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('compare_list', JSON.stringify(compareList));
        } catch (e) {
            console.error('Error saving compare_list:', e);
        }
    }, [compareList]);

    const addToCompare = (productId) => {
        if (!productId) return;
        const pIdStr = productId.toString();
        if (compareList.includes(pIdStr)) {
            toast.info("Item is already in comparison");
            return;
        }
        if (compareList.length >= 4) {
            toast.warning("You can compare up to 4 products at a time");
            return;
        }
        setCompareList(prev => [...prev, pIdStr]);
        toast.success("Added to comparison");
    };

    const removeFromCompare = (productId) => {
        if (!productId) return;
        const pIdStr = productId.toString();
        setCompareList(prev => prev.filter(id => id !== pIdStr));
        toast.info("Removed from comparison");
    };

    const isInCompare = (productId) => {
        if (!productId) return false;
        return compareList.includes(productId.toString());
    };

    const clearCompare = () => {
        setCompareList([]);
        toast.info("Cleared comparison list");
    };

    // Hindi / English Language state
    const [language, setLanguage] = useState(() => {
        try {
            return localStorage.getItem('app_lang') || 'en';
        } catch {
            return 'en';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('app_lang', language);
        } catch (e) {
            console.error('Error saving app_lang:', e);
        }
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
    };

    const t = (key) => {
        if (!translations[language]) return key;
        return translations[language][key] || translations['en'][key] || key;
    };

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems,
        getCartCount, updateQuantity,
        getCartAmount, navigate, backendUrl,
        setToken, token,
        // Search API
        searchProductsApi,
        // Wishlist
        wishlist, toggleWishlist, isInWishlist, getWishlistCount,
        // Recently Viewed
        recentlyViewed, recordRecentlyViewed, getRecentlyViewedProducts,
        // Save for Later
        savedForLater, saveForLaterAction, moveToCartAction, removeSavedForLaterAction,
        // Product Comparison
        compareList, addToCompare, removeFromCompare, isInCompare, clearCompare,
        // Language i18n
        language, setLanguage, toggleLanguage, t,
        // Coupons
        appliedCoupon, applyCoupon, removeCoupon, getDiscountAmount, getFinalAmount, availableCoupons: liveCoupons,
        // Reviews
        reviews, addReview, getProductReviews, getProductAverageRating
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
};

export default ShopContextProvider;