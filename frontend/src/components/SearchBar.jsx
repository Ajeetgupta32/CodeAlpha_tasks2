import React, { useContext, useEffect, useState, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import { useLocation, useNavigate } from 'react-router-dom';
import VisualSearchModal from './VisualSearchModal';
import { toast } from 'react-toastify';

const SearchBar = () => {
    const { search, setSearch, showSearch, setShowSearch, products, currency, t } = useContext(ShopContext);
    const [visible, setVisible] = useState(false);
    const [showVisualModal, setShowVisualModal] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Recent searches state
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const saved = localStorage.getItem('recent_user_searches');
            return saved ? JSON.parse(saved) : ['Cotton Shirt', 'Casual Jacket', 'Men T-shirt'];
        } catch {
            return [];
        }
    });

    const saveRecentSearch = (query) => {
        if (!query || !query.trim()) return;
        const clean = query.trim();
        setRecentSearches(prev => {
            const next = [clean, ...prev.filter(item => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
            try {
                localStorage.setItem('recent_user_searches', JSON.stringify(next));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recent_user_searches');
    };

    useEffect(() => {
        if (location.pathname.includes('collection')) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [location]);

    // Live suggestions filter
    useEffect(() => {
        if (search && search.trim().length >= 2 && products) {
            const q = search.trim().toLowerCase();
            const matches = products
                .filter(p =>
                    p.name.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q) ||
                    (p.subCategory && p.subCategory.toLowerCase().includes(q))
                )
                .slice(0, 5);
            setSuggestions(matches);
            setShowDropdown(matches.length > 0);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
        }
    }, [search, products]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setShowDropdown(false);
            saveRecentSearch(search);
            if (!location.pathname.includes('collection')) {
                navigate('/collection');
            }
        }
    };

    // Voice search handler
    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice search is not supported by your current browser. Try Chrome or Edge.");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                toast.info("Listening... Speak your product search query.");
            };

            recognition.onresult = (event) => {
                setIsListening(false);
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setSearch(transcript);
                    saveRecentSearch(transcript);
                    toast.success(`Heard: "${transcript}"`);
                    if (!location.pathname.includes('collection')) {
                        navigate('/collection');
                    }
                }
            };

            recognition.onerror = (event) => {
                setIsListening(false);
                console.error("Speech recognition error:", event.error);
                toast.error("Could not capture speech. Please try speaking closer to microphone.");
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } catch (err) {
            console.error(err);
            setIsListening(false);
            toast.error("Voice search initialization failed.");
        }
    };

    return showSearch && visible ? (
        <>
            <div className='border-t border-b bg-gray-50 text-center py-4 px-3 relative'>
                <div ref={dropdownRef} className='inline-block relative w-full sm:w-3/5 md:w-1/2 text-left'>
                    <div className={`inline-flex items-center justify-between border bg-white px-4 sm:px-5 py-2.5 rounded-full w-full shadow-xs transition-all ${
                        isListening
                            ? 'border-red-500 ring-2 ring-red-200'
                            : 'border-gray-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black'
                    }`}>
                        <img className='w-4 mr-2 opacity-60' src={assets.search_icon} alt="" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className='flex-1 outline-none bg-inherit text-xs sm:text-sm'
                            type="text"
                            placeholder={isListening ? 'Listening... Speak now!' : (t ? t('search') : 'Search clothing by title, style or fit...')}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className='text-xs text-gray-400 hover:text-gray-700 font-bold px-1.5'
                                title="Clear input"
                            >
                                ✕
                            </button>
                        )}

                        {/* Voice Search Button */}
                        <button
                            type="button"
                            onClick={handleVoiceSearch}
                            className={`ml-1.5 p-1 transition flex items-center justify-center rounded-full ${
                                isListening
                                    ? 'bg-red-50 text-red-600 animate-pulse'
                                    : 'text-gray-500 hover:text-black'
                            }`}
                            title="Voice Search (Speak into microphone)"
                        >
                            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z'/>
                                <path d='M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z'/>
                            </svg>
                        </button>

                        {/* Visual Search Camera Button */}
                        <button
                            type="button"
                            onClick={() => setShowVisualModal(true)}
                            className='ml-1.5 p-1 text-gray-500 hover:text-indigo-600 transition flex items-center justify-center'
                            title="Search by image / photo"
                        >
                            <span className='text-sm sm:text-base'>📷</span>
                        </button>
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {showDropdown && suggestions.length > 0 && (
                        <div className='absolute left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 text-xs animate-in fade-in'>
                            <div className='p-2 bg-gray-50 border-b text-[10px] font-semibold uppercase tracking-wider text-gray-500'>
                                Suggested Products
                            </div>
                            <div className='divide-y divide-gray-100 max-h-64 overflow-y-auto'>
                                {suggestions.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => {
                                            setShowDropdown(false);
                                            saveRecentSearch(item.name);
                                            navigate(`/product/${item._id}`);
                                        }}
                                        className='p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition'
                                    >
                                        <img
                                            src={Array.isArray(item.image) ? item.image[0] : item.image}
                                            alt={item.name}
                                            className='w-9 h-9 object-cover rounded border'
                                        />
                                        <div className='flex-1 truncate'>
                                            <p className='font-semibold text-gray-900 truncate'>{item.name}</p>
                                            <span className='text-[10px] text-gray-400 capitalize'>{item.category} &bull; {item.subCategory}</span>
                                        </div>
                                        <span className='font-bold text-gray-900'>{currency}{item.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <img
                    onClick={() => setShowSearch(false)}
                    className='inline w-3.5 cursor-pointer ml-3 opacity-60 hover:opacity-100 transition'
                    src={assets.cross_icon}
                    alt="Close search"
                />

                {/* Recent Searches Pills */}
                {recentSearches.length > 0 && (
                    <div className='flex items-center justify-center flex-wrap gap-1.5 mt-2.5 text-xs text-gray-500'>
                        <span className='text-[11px] font-medium'>Recent:</span>
                        {recentSearches.map((term, i) => (
                            <button
                                key={i}
                                type='button'
                                onClick={() => {
                                    setSearch(term);
                                    if (!location.pathname.includes('collection')) {
                                        navigate('/collection');
                                    }
                                }}
                                className='bg-white border border-gray-200 hover:border-black text-gray-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition'
                            >
                                {term}
                            </button>
                        ))}
                        <button
                            type='button'
                            onClick={clearRecentSearches}
                            className='text-[10px] text-gray-400 hover:text-red-500 ml-1 underline'
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            <VisualSearchModal
                isOpen={showVisualModal}
                onClose={() => setShowVisualModal(false)}
            />
        </>
    ) : null;
};

export default SearchBar;
