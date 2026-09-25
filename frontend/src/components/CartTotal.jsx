import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

const CartTotal = () => {
    const {
        currency,
        delivery_fee,
        getCartAmount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        getDiscountAmount,
        getFinalAmount,
        availableCoupons
    } = useContext(ShopContext);

    const [couponInput, setCouponInput] = useState('');
    const [showModal, setShowModal] = useState(false);

    const subtotal = getCartAmount();
    const discount = getDiscountAmount();
    const finalTotal = getFinalAmount();

    const handleApply = (e) => {
        e.preventDefault();
        if (applyCoupon(couponInput)) {
            setCouponInput('');
        }
    };

    const handleSelectCoupon = (code) => {
        if (applyCoupon(code)) {
            setShowModal(false);
            setCouponInput('');
        }
    };

    const couponList = availableCoupons
        ? Object.entries(availableCoupons).map(([code, details]) => ({ code, ...details }))
        : [];

    return (
        <div className='w-full bg-white p-5 border rounded-lg shadow-sm relative'>
            <div className='text-xl mb-3'>
                <Title text1={'CART'} text2={'TOTALS'} />
            </div>

            <div className='flex flex-col gap-2.5 text-sm text-gray-700'>
                <div className='flex justify-between'>
                    <p>Subtotal</p>
                    <p className='font-medium'>{currency}{subtotal.toFixed(2)}</p>
                </div>

                {appliedCoupon && (
                    <div className='flex justify-between text-green-600 font-medium'>
                        <span className='flex items-center gap-1.5'>
                            <span>🏷️ Discount ({appliedCoupon.code})</span>
                            <button
                                onClick={removeCoupon}
                                className='text-xs text-red-500 hover:underline'
                                title="Remove coupon"
                            >
                                [Remove]
                            </button>
                        </span>
                        <p>-{currency}{discount.toFixed(2)}</p>
                    </div>
                )}

                <div className='flex justify-between'>
                    <p>Shipping Fee</p>
                    <p className='font-medium'>{currency}{subtotal === 0 ? '0.00' : `${delivery_fee}.00`}</p>
                </div>

                <hr className='border-gray-200 my-1' />

                <div className='flex justify-between text-base'>
                    <b className='text-gray-900'>Total</b>
                    <b className='text-gray-900'>{currency}{finalTotal.toFixed(2)}</b>
                </div>
            </div>

            {/* Promo Code Box */}
            <div className='mt-6 pt-5 border-t'>
                <div className='flex items-center justify-between mb-2'>
                    <p className='text-xs font-semibold text-gray-700 uppercase tracking-wider'>
                        Have a Promo Code?
                    </p>
                    {couponList.length > 0 && (
                        <button
                            type='button'
                            onClick={() => setShowModal(true)}
                            className='text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1'
                        >
                            <span>🎟️ View Offers ({couponList.length})</span>
                        </button>
                    )}
                </div>

                {appliedCoupon ? (
                    <div className='flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-800'>
                        <div className='flex items-center gap-1.5'>
                            <span className='font-bold text-sm'>✓</span>
                            <span><b>{appliedCoupon.code}</b> applied ({appliedCoupon.description})</span>
                        </div>
                        <button
                            onClick={removeCoupon}
                            className='text-red-600 font-semibold hover:underline ml-2'
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div>
                        <form onSubmit={handleApply} className='flex gap-2'>
                            <input
                                type='text'
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value)}
                                placeholder='Try: WELCOME10, SAVE20'
                                className='flex-1 border border-gray-300 rounded px-3 py-2 text-xs uppercase focus:outline-none focus:border-black'
                            />
                            <button
                                type='submit'
                                className='bg-black text-white px-4 py-2 rounded text-xs font-medium uppercase hover:bg-gray-800 transition-colors'
                            >
                                Apply
                            </button>
                        </form>
                        <div className='flex flex-wrap gap-1.5 mt-2 text-[11px] text-gray-500'>
                            <span>Suggested:</span>
                            {couponList.slice(0, 3).map((c) => (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleSelectCoupon(c.code)}
                                    className='text-black font-semibold hover:underline bg-gray-100 px-1.5 py-0.5 rounded'
                                >
                                    {c.code} ({c.type === 'percent' ? `${c.value}%` : `${currency}${c.value}`})
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Coupons Modal */}
            {showModal && (
                <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4'>
                    <div className='bg-white rounded-xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95'>
                        <div className='flex items-center justify-between pb-3 border-b'>
                            <h3 className='text-base font-bold text-gray-900 flex items-center gap-2'>
                                <span>🎟️</span> Available Coupons & Offers
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className='text-gray-400 hover:text-black text-lg font-bold w-7 h-7 rounded flex items-center justify-center'
                            >
                                &times;
                            </button>
                        </div>

                        <div className='mt-4 flex flex-col gap-3'>
                            {couponList.map((c) => {
                                const isEligible = !c.minOrder || subtotal >= c.minOrder;
                                const isApplied = appliedCoupon && appliedCoupon.code === c.code;

                                return (
                                    <div
                                        key={c.code}
                                        className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition ${
                                            isApplied
                                                ? 'bg-green-50 border-green-300'
                                                : isEligible
                                                ? 'bg-white border-gray-200 hover:border-gray-400 shadow-2xs'
                                                : 'bg-gray-50 border-gray-200 opacity-60'
                                        }`}
                                    >
                                        <div>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-mono font-bold text-xs uppercase px-2 py-0.5 bg-gray-100 rounded border border-gray-300 text-gray-900'>
                                                    {c.code}
                                                </span>
                                                <span className='text-xs font-bold text-emerald-600'>
                                                    {c.type === 'percent' ? `${c.value}% OFF` : `${currency}${c.value} FLAT`}
                                                </span>
                                            </div>
                                            <p className='text-xs text-gray-600 mt-1'>{c.description}</p>
                                            {c.minOrder > 0 && (
                                                <p className='text-[10px] text-gray-500 mt-0.5'>
                                                    Min cart value: {currency}{c.minOrder}
                                                    {!isEligible && (
                                                        <span className='text-amber-600 ml-1'>
                                                            (Add {currency}{(c.minOrder - subtotal).toFixed(2)} more)
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            {isApplied ? (
                                                <span className='text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded'>
                                                    Applied
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSelectCoupon(c.code)}
                                                    disabled={!isEligible}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition ${
                                                        isEligible
                                                            ? 'bg-black text-white hover:bg-gray-800'
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Apply
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartTotal;
