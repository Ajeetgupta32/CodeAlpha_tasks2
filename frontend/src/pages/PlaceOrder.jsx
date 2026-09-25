import React, { useContext, useEffect, useState } from 'react';
import Title from '../components/Title';
import CartTotal from '../components/CartTotal';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PlaceOrder = () => {
    const [step, setStep] = useState(1); // 1: Address, 2: Delivery, 3: Gift, 4: Payment
    const [method, setMethod] = useState('cod');
    const { navigate, backendUrl, token, cartItems, setCartItems, products, getFinalAmount, currency } = useContext(ShopContext);

    // Shipping address state
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: 'India',
        phone: ''
    });

    // Step 2: Shipping Method
    const [shippingSpeed, setShippingSpeed] = useState('standard'); // 'standard' | 'express'

    // Step 3: Gift Options
    const [isGift, setIsGift] = useState(false);
    const [giftMessage, setGiftMessage] = useState('');

    // Loyalty Points state
    const [userPoints, setUserPoints] = useState(0);
    const [redeemPoints, setRedeemPoints] = useState(false);

    // Fetch saved user addresses from profile
    useEffect(() => {
        const fetchAddresses = async () => {
            if (!token) return;
            try {
                const res = await axios.post(`${backendUrl}/api/user/profile`, {}, { headers: { token } });
                if (res.data.success && res.data.profile) {
                    setUserPoints(res.data.profile.rewardPoints || 0);
                    const addrs = res.data.profile.addresses || [];
                    setSavedAddresses(addrs);
                    const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
                    if (defaultAddr) {
                        setSelectedAddressId(defaultAddr.id);
                        setFormData({
                            firstName: defaultAddr.firstName || '',
                            lastName: defaultAddr.lastName || '',
                            email: defaultAddr.email || res.data.profile.email,
                            street: defaultAddr.street || '',
                            city: defaultAddr.city || '',
                            state: defaultAddr.state || '',
                            zipcode: defaultAddr.zipcode || '',
                            country: defaultAddr.country || 'India',
                            phone: defaultAddr.phone || ''
                        });
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchAddresses();
    }, [token, backendUrl]);

    const handleSelectSavedAddress = (addr) => {
        setSelectedAddressId(addr.id);
        setFormData({
            firstName: addr.firstName,
            lastName: addr.lastName,
            email: addr.email,
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipcode: addr.zipcode,
            country: addr.country,
            phone: addr.phone
        });
    };

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setFormData(data => ({ ...data, [name]: value }));
    };

    const validateStep1 = () => {
        if (!formData.firstName || !formData.lastName || !formData.street || !formData.city || !formData.zipcode || !formData.phone) {
            toast.error("Please fill in all required shipping address fields");
            return false;
        }
        return true;
    };

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: 'Order Payment',
            description: 'Order Payment',
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                try {
                    const { data } = await axios.post(backendUrl + '/api/order/verifyRazorpay', response, { headers: { token } });
                    if (data.success) {
                        navigate('/orders');
                        setCartItems({});
                    }
                } catch (error) {
                    console.log(error);
                    toast.error(error.message);
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        try {
            let orderItems = [];
            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find(product => product._id === items));
                        if (itemInfo) {
                            itemInfo.size = item;
                            itemInfo.quantity = cartItems[items][item];
                            orderItems.push(itemInfo);
                        }
                    }
                }
            }

            if (orderItems.length === 0) {
                toast.error("Your cart is empty");
                navigate('/collection');
                return;
            }

            let finalAmount = getFinalAmount();
            if (shippingSpeed === 'express') {
                finalAmount += 10;
            }

            const maxRedeemablePoints = Math.floor(userPoints / 100) * 100;
            const pointsDiscount = (redeemPoints && maxRedeemablePoints >= 100) ? Math.min(maxRedeemablePoints / 10, finalAmount) : 0;
            const pointsRedeemedCount = pointsDiscount > 0 ? (pointsDiscount * 10) : 0;
            finalAmount = Math.max(0, finalAmount - pointsDiscount);

            let orderData = {
                address: {
                    ...formData,
                    shippingSpeed,
                    isGift,
                    giftMessage: isGift ? giftMessage : ''
                },
                items: orderItems,
                amount: finalAmount,
                pointsRedeemed: pointsRedeemedCount
            };

            switch (method) {
                case 'cod':
                    const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } });
                    if (response.data.success) {
                        setCartItems({});
                        toast.success("Order placed successfully!");
                        navigate('/orders');
                    } else {
                        toast.error(response.data.message);
                    }
                    break;

                case 'stripe':
                    const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { token } });
                    if (responseStripe.data.success) {
                        const { session_url } = responseStripe.data;
                        window.location.replace(session_url);
                    } else {
                        toast.error(responseStripe.data.message);
                    }
                    break;

                case 'razorpay':
                    const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, { headers: { token } });
                    if (responseRazorpay.data.success) {
                        initPay(responseRazorpay.data.order);
                    } else {
                        toast.error(responseRazorpay.data.message);
                    }
                    break;

                default:
                    break;
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    return (
        <div className='pt-8 sm:pt-12 min-h-[80vh] border-t'>
            {/* Multi-step Header Stepper */}
            <div className='max-w-3xl mx-auto mb-10'>
                <div className='flex items-center justify-between relative'>
                    <div className='absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-1'></div>
                    {[
                        { num: 1, label: 'Address' },
                        { num: 2, label: 'Delivery' },
                        { num: 3, label: 'Gift Wrap' },
                        { num: 4, label: 'Payment' }
                    ].map((s) => (
                        <div key={s.num} className='flex flex-col items-center bg-white px-2'>
                            <button
                                type='button'
                                onClick={() => {
                                    if (s.num < step || validateStep1()) {
                                        setStep(s.num);
                                    }
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                    step === s.num
                                        ? 'bg-black text-white ring-4 ring-gray-100 scale-110'
                                        : step > s.num
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-400 border'
                                }`}
                            >
                                {step > s.num ? '✓' : s.num}
                            </button>
                            <span className={`text-[11px] font-semibold mt-1 ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={onSubmitHandler} className='flex flex-col lg:flex-row justify-between gap-8 max-w-6xl mx-auto'>
                {/* Left Side: Step View */}
                <div className='flex-1 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm'>
                    {/* STEP 1: Address */}
                    {step === 1 && (
                        <div>
                            <div className='text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center justify-between'>
                                <span>Step 1: Shipping Address</span>
                                <span className='text-xs font-normal text-gray-500'>Where should we send your package?</span>
                            </div>

                            {/* Saved Address Cards */}
                            {savedAddresses.length > 0 && (
                                <div className='mb-6 space-y-3'>
                                    <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>Saved Addresses:</p>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                        {savedAddresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                onClick={() => handleSelectSavedAddress(addr)}
                                                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                                                    selectedAddressId === addr.id
                                                        ? 'border-black bg-gray-50 ring-1 ring-black'
                                                        : 'border-gray-200 hover:border-gray-400'
                                                }`}
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <span className='font-bold text-gray-900'>{addr.firstName} {addr.lastName}</span>
                                                    {addr.isDefault && (
                                                        <span className='text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold'>
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className='text-gray-600 mt-1 truncate'>{addr.street}, {addr.city}</p>
                                                <p className='text-gray-500'>{addr.state} {addr.zipcode}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setSelectedAddressId('new');
                                            setFormData({
                                                firstName: '',
                                                lastName: '',
                                                email: '',
                                                street: '',
                                                city: '',
                                                state: '',
                                                zipcode: '',
                                                country: 'India',
                                                phone: ''
                                            });
                                        }}
                                        className='text-xs font-semibold text-blue-600 hover:underline mt-1 inline-block'
                                    >
                                        + Enter a different address
                                    </button>
                                </div>
                            )}

                            {/* Address Form Fields */}
                            <div className='space-y-3 text-xs'>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <label className='font-medium text-gray-700 block mb-1'>First name *</label>
                                        <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="text" placeholder='John' />
                                    </div>
                                    <div>
                                        <label className='font-medium text-gray-700 block mb-1'>Last name *</label>
                                        <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="text" placeholder='Doe' />
                                    </div>
                                </div>
                                <div>
                                    <label className='font-medium text-gray-700 block mb-1'>Email address *</label>
                                    <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="email" placeholder='john@example.com' />
                                </div>
                                <div>
                                    <label className='font-medium text-gray-700 block mb-1'>Street Address *</label>
                                    <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="text" placeholder='House/Flat no., Street name' />
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <label className='font-medium text-gray-700 block mb-1'>City *</label>
                                        <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="text" placeholder='New Delhi' />
                                    </div>
                                    <div>
                                        <label className='font-medium text-gray-700 block mb-1'>State</label>
                                        <input onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="text" placeholder='Delhi' />
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div>
                                        <label className='font-medium text-gray-700 block mb-1'>Postal / ZIP Code *</label>
                                        <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="text" placeholder='110001' />
                                    </div>
                                    <div>
                                        <label className='font-medium text-gray-700 block mb-1'>Country</label>
                                        <input required onChange={onChangeHandler} name='country' value={formData.country} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="text" placeholder='India' />
                                    </div>
                                </div>
                                <div>
                                    <label className='font-medium text-gray-700 block mb-1'>Phone Number *</label>
                                    <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded p-2.5 w-full focus:outline-black' type="tel" placeholder='+91 9876543210' />
                                </div>
                            </div>

                            <div className='mt-6 pt-4 border-t flex justify-end'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        if (validateStep1()) setStep(2);
                                    }}
                                    className='px-8 py-3 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition flex items-center gap-1.5'
                                >
                                    Continue to Delivery &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Delivery Speed */}
                    {step === 2 && (
                        <div>
                            <div className='text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center justify-between'>
                                <span>Step 2: Choose Delivery Option</span>
                                <span className='text-xs font-normal text-gray-500'>Fast & reliable fulfillment</span>
                            </div>

                            <div className='space-y-4'>
                                <div
                                    onClick={() => setShippingSpeed('standard')}
                                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                                        shippingSpeed === 'standard' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <input
                                            type='radio'
                                            name='shippingSpeed'
                                            checked={shippingSpeed === 'standard'}
                                            onChange={() => setShippingSpeed('standard')}
                                            className='accent-black w-4 h-4'
                                        />
                                        <div>
                                            <p className='font-bold text-sm text-gray-900'>Standard Shipping</p>
                                            <p className='text-xs text-gray-500 mt-0.5'>Delivered within 4-5 business days</p>
                                        </div>
                                    </div>
                                    <span className='font-bold text-emerald-600 text-xs uppercase'>FREE</span>
                                </div>

                                <div
                                    onClick={() => setShippingSpeed('express')}
                                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                                        shippingSpeed === 'express' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <input
                                            type='radio'
                                            name='shippingSpeed'
                                            checked={shippingSpeed === 'express'}
                                            onChange={() => setShippingSpeed('express')}
                                            className='accent-black w-4 h-4'
                                        />
                                        <div>
                                            <p className='font-bold text-sm text-gray-900 flex items-center gap-1.5'>
                                                <span>⚡ Express Prime Delivery</span>
                                                <span className='text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold'>2 DAYS</span>
                                            </p>
                                            <p className='text-xs text-gray-500 mt-0.5'>Guaranteed fast turnaround with priority handling</p>
                                        </div>
                                    </div>
                                    <span className='font-bold text-gray-900 text-sm'>+{currency}10.00</span>
                                </div>
                            </div>

                            <div className='mt-8 pt-4 border-t flex justify-between'>
                                <button
                                    type='button'
                                    onClick={() => setStep(1)}
                                    className='px-5 py-2.5 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition'
                                >
                                    &larr; Back to Address
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setStep(3)}
                                    className='px-8 py-2.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition'
                                >
                                    Continue to Gift Options &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Gift Options */}
                    {step === 3 && (
                        <div>
                            <div className='text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center justify-between'>
                                <span>Step 3: Gift Wrapping & Message</span>
                                <span className='text-xs font-normal text-gray-500'>Optional festive touch</span>
                            </div>

                            <div className='space-y-5'>
                                <div className='p-4 rounded-xl border border-gray-200 bg-amber-50/40 flex items-start gap-3'>
                                    <input
                                        type='checkbox'
                                        id='giftCheck'
                                        checked={isGift}
                                        onChange={(e) => setIsGift(e.target.checked)}
                                        className='mt-1 w-4 h-4 accent-black cursor-pointer'
                                    />
                                    <label htmlFor='giftCheck' className='text-xs cursor-pointer select-none'>
                                        <p className='font-bold text-gray-900 text-sm'>🎁 This order is a gift</p>
                                        <p className='text-gray-600 mt-0.5'>
                                            We will include free decorative festive gift packaging and hide item prices from the delivery receipt!
                                        </p>
                                    </label>
                                </div>

                                {isGift && (
                                    <div className='animate-in fade-in space-y-2 text-xs'>
                                        <label className='font-bold text-gray-800 block'>Personalized Gift Note (Printed on card):</label>
                                        <textarea
                                            value={giftMessage}
                                            onChange={(e) => setGiftMessage(e.target.value)}
                                            rows={3}
                                            maxLength={200}
                                            placeholder='e.g. Wishing you a very Happy Birthday! Hope you love this gift!'
                                            className='w-full p-3 border border-gray-300 rounded-lg focus:outline-black'
                                        ></textarea>
                                        <span className='text-[10px] text-gray-400 block text-right'>{200 - giftMessage.length} characters left</span>
                                    </div>
                                )}
                            </div>

                            <div className='mt-8 pt-4 border-t flex justify-between'>
                                <button
                                    type='button'
                                    onClick={() => setStep(2)}
                                    className='px-5 py-2.5 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition'
                                >
                                    &larr; Back to Delivery
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setStep(4)}
                                    className='px-8 py-2.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition'
                                >
                                    Continue to Payment &rarr;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Payment Selection & Review */}
                    {step === 4 && (
                        <div>
                            <div className='text-lg font-bold text-gray-900 mb-4 pb-2 border-b flex items-center justify-between'>
                                <span>Step 4: Payment Method</span>
                                <span className='text-xs font-normal text-gray-500'>100% Encrypted & Secure</span>
                            </div>

                            <div className='space-y-3 mb-6'>
                                <div
                                    onClick={() => setMethod('stripe')}
                                    className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition ${
                                        method === 'stripe' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <p className={`w-4 h-4 border rounded-full flex items-center justify-center ${method === 'stripe' ? 'border-black bg-black text-white text-[10px]' : ''}`}>
                                            {method === 'stripe' && '✓'}
                                        </p>
                                        <span className='text-xs font-bold text-gray-800'>Debit / Credit Card (Stripe)</span>
                                    </div>
                                    <img className='h-5' src={assets.stripe_logo} alt="Stripe" />
                                </div>

                                <div
                                    onClick={() => setMethod('razorpay')}
                                    className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition ${
                                        method === 'razorpay' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <p className={`w-4 h-4 border rounded-full flex items-center justify-center ${method === 'razorpay' ? 'border-black bg-black text-white text-[10px]' : ''}`}>
                                            {method === 'razorpay' && '✓'}
                                        </p>
                                        <span className='text-xs font-bold text-gray-800'>UPI / Netbanking (Razorpay)</span>
                                    </div>
                                    <img className='h-5' src={assets.razorpay_logo} alt="Razorpay" />
                                </div>

                                <div
                                    onClick={() => setMethod('cod')}
                                    className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition ${
                                        method === 'cod' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <p className={`w-4 h-4 border rounded-full flex items-center justify-center ${method === 'cod' ? 'border-black bg-black text-white text-[10px]' : ''}`}>
                                            {method === 'cod' && '✓'}
                                        </p>
                                        <span className='text-xs font-bold text-gray-800'>Cash on Delivery (Pay at doorstep)</span>
                                    </div>
                                    <span className='text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded'>COD</span>
                                </div>
                            </div>

                            {/* Loyalty Points Redemption Box */}
                            {userPoints >= 100 && (
                                <div className='p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 mb-5 flex items-start gap-3'>
                                    <input
                                        type='checkbox'
                                        id='redeemPointsCheck'
                                        checked={redeemPoints}
                                        onChange={(e) => setRedeemPoints(e.target.checked)}
                                        className='mt-1 w-4 h-4 accent-amber-600 cursor-pointer'
                                    />
                                    <label htmlFor='redeemPointsCheck' className='text-xs cursor-pointer select-none'>
                                        <p className='font-bold text-amber-950 text-sm flex items-center gap-1.5'>
                                            <span>🪙</span> Redeem NEXUS Reward Points ({userPoints} available)
                                        </p>
                                        <p className='text-amber-900 mt-0.5 leading-relaxed'>
                                            Apply {Math.floor(userPoints / 100) * 100} points for an instant <b>{currency}{Math.floor(userPoints / 100) * 10} discount</b> on this order!
                                        </p>
                                    </label>
                                </div>
                            )}

                            {/* Delivery & Gift Summary Review Box */}
                            <div className='p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-xs space-y-1.5 text-gray-600 mb-6'>
                                <p>
                                    <b className='text-gray-900'>Deliver to:</b> {formData.firstName} {formData.lastName}, {formData.street}, {formData.city} ({formData.phone})
                                </p>
                                <p>
                                    <b className='text-gray-900'>Shipping:</b> {shippingSpeed === 'express' ? 'Express 2-Day (+$10)' : 'Standard Free (4-5 Days)'}
                                </p>
                                {isGift && (
                                    <p className='text-amber-800 font-medium'>
                                        <b>Gift Wrapped:</b> Yes (with card message)
                                    </p>
                                )}
                            </div>

                            <div className='flex items-center justify-between pt-4 border-t'>
                                <button
                                    type='button'
                                    onClick={() => setStep(3)}
                                    className='px-5 py-2.5 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition'
                                >
                                    &larr; Back
                                </button>
                                <button
                                    type='submit'
                                    className='bg-black hover:bg-gray-800 text-white px-10 py-3.5 text-xs font-bold uppercase rounded-lg transition shadow-md'
                                >
                                    CONFIRM & PLACE ORDER
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Order Summary Card */}
                <div className='w-full lg:w-96'>
                    <CartTotal />
                </div>
            </form>
        </div>
    );
};

export default PlaceOrder;
