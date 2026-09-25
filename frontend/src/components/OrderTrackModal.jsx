import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderTrackModal = ({ isOpen, onClose, order, backendUrl, token, onOrderUpdated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnReason, setReturnReason] = useState('Size too small');
  const [showReturnForm, setShowReturnForm] = useState(false);

  if (!isOpen || !order) return null;

  const stages = [
    { title: "Order Placed", desc: "Your order has been confirmed" },
    { title: "Processing", desc: "Package is being prepared" },
    { title: "Shipped", desc: "Handed over to delivery carrier" },
    { title: "Out for Delivery", desc: "Reaching your doorstep today" },
    { title: "Delivered", desc: "Delivered successfully" }
  ];

  // Map order status to stage index
  const getStageIndex = (status) => {
    switch (status) {
      case 'Order Placed': return 0;
      case 'Packing':
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Out for delivery':
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      case 'Cancelled': return -1;
      case 'Return Requested': return 5;
      default: return 0;
    }
  };

  const currentStage = getStageIndex(order.status);
  const isCancelled = order.status === 'Cancelled';
  const isReturnRequested = order.status === 'Return Requested';
  const canCancel = currentStage >= 0 && currentStage <= 1 && !isCancelled;
  const canReturn = currentStage === 4 && !isReturnRequested;

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setIsProcessing(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/cancel`,
        { orderId: order._id, reason: 'Customer requested cancellation' },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.info("Order has been cancelled successfully");
        if (onOrderUpdated) onOrderUpdated();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/order/return`,
        { orderId: order._id, reason: returnReason },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(`Return request submitted: "${returnReason}". Refund will be credited within 3-5 days.`);
        if (onOrderUpdated) onOrderUpdated();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to submit return");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gray-200'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-black w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition'
        >
          ✕
        </button>

        <div className='mb-6'>
          <span className='text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono'>
            ID: #{order._id?.slice(-8) || order.id}
          </span>
          <h3 className='text-xl font-bold text-gray-900 mt-1'>Order Delivery Tracking</h3>
          <p className='text-xs text-gray-500'>
            Expected Delivery: <span className='font-semibold text-gray-800'>Standard 3-5 business days</span>
          </p>
        </div>

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className='mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2'>
            <span>⚠️</span> This order was cancelled. Any pre-paid charges have been credited.
          </div>
        )}

        {/* Return Requested Banner */}
        {isReturnRequested && (
          <div className='mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-2'>
            <span>🔄</span> Return & Refund requested. Carrier pickup scheduled shortly.
          </div>
        )}

        {/* Stepper Timeline & Courier Route Visualization */}
        {!isCancelled && !isReturnRequested && (
          <div className='my-6'>
            {/* Courier Dispatch Partner Box */}
            <div className='mb-5 p-3.5 bg-gradient-to-r from-gray-50 to-blue-50/40 rounded-xl border border-gray-200 text-xs flex items-center justify-between'>
              <div>
                <p className='text-[10px] uppercase font-bold text-gray-400 tracking-wider'>Courier Partner</p>
                <p className='font-bold text-gray-900 flex items-center gap-1.5 mt-0.5'>
                  <span>📦</span> BlueDart Express Air (Prime Direct)
                </p>
                <p className='text-[11px] text-gray-500 font-mono mt-0.5'>
                  AWB: <span className='font-semibold text-gray-800'>BD-789021482IN</span>
                </p>
              </div>
              <div className='text-right'>
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800'>
                  <span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-ping'></span>
                  Live GPS
                </span>
                <p className='text-[11px] text-gray-600 font-medium mt-1'>ETA: 2-4 PM</p>
              </div>
            </div>

            {/* Courier Delivery Route Graphic */}
            <div className='mb-6 p-3 bg-gray-50/80 rounded-xl border border-gray-100'>
              <div className='flex items-center justify-between text-[10px] font-semibold text-gray-500 mb-2'>
                <span>🏭 Central Fulfillment</span>
                <span>🚚 Courier Van</span>
                <span>📍 Doorstep</span>
              </div>
              <div className='relative h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-black transition-all duration-700 rounded-full'
                  style={{ width: `${Math.max(15, ((currentStage + 1) / stages.length) * 100)}%` }}
                />
              </div>
              <p className='text-[10px] text-gray-500 text-center mt-2'>
                {currentStage === 4 ? 'Package delivered to recipient.' : currentStage === 3 ? 'Courier van is out for delivery in your neighborhood.' : 'Package is moving across regional courier sorting hubs.'}
              </p>
            </div>

            {/* Stepper Timeline */}
            <div className='space-y-4'>
              {stages.map((st, idx) => {
                const isPastOrCurrent = currentStage >= idx;
                const isCurrent = currentStage === idx;

                return (
                  <div key={idx} className='flex items-start gap-3.5 relative'>
                    {/* Vertical line between dots */}
                    {idx < stages.length - 1 && (
                      <div
                        className={`absolute left-3 top-6 w-0.5 h-8 ${
                          currentStage > idx ? 'bg-black' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Dot icon */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold ${
                        isCurrent
                          ? 'bg-black text-white ring-4 ring-gray-100'
                          : isPastOrCurrent
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isPastOrCurrent ? '✓' : idx + 1}
                    </div>

                    {/* Description */}
                    <div className='flex-1 pb-2'>
                      <h5 className={`text-xs font-bold ${isPastOrCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                        {st.title}
                      </h5>
                      <p className='text-[11px] text-gray-500 leading-tight'>{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Return Form */}
        {showReturnForm ? (
          <form onSubmit={handleReturnOrder} className='mt-4 p-4 border rounded-xl bg-gray-50 text-xs space-y-3'>
            <h5 className='font-bold text-gray-900'>Select Return Reason:</h5>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className='w-full border p-2 rounded bg-white outline-none'
            >
              <option value="Size too small">Size too small</option>
              <option value="Size too large">Size too large</option>
              <option value="Fabric quality not as expected">Fabric quality not as expected</option>
              <option value="Defective or damaged garment">Defective or damaged garment</option>
              <option value="Received wrong item">Received wrong item</option>
            </select>
            <div className='flex gap-2 justify-end'>
              <button
                type="button"
                onClick={() => setShowReturnForm(false)}
                className='px-3 py-1.5 text-gray-600 hover:underline'
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className='bg-black text-white px-4 py-1.5 rounded font-medium disabled:opacity-50'
              >
                {isProcessing ? 'Submitting...' : 'Confirm Return'}
              </button>
            </div>
          </form>
        ) : (
          /* Action Footer */
          <div className='flex items-center justify-between gap-3 pt-4 border-t mt-4'>
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={isProcessing}
                className='text-xs text-red-600 hover:text-red-700 font-semibold border border-red-200 px-3.5 py-2 rounded-lg hover:bg-red-50 transition'
              >
                {isProcessing ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {canReturn && (
              <button
                onClick={() => setShowReturnForm(true)}
                className='text-xs text-orange-600 hover:text-orange-700 font-semibold border border-orange-200 px-3.5 py-2 rounded-lg hover:bg-orange-50 transition'
              >
                Request Return / Refund
              </button>
            )}

            <button
              onClick={onClose}
              className='ml-auto bg-black text-white text-xs px-5 py-2 rounded-lg font-medium hover:bg-gray-800 transition'
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackModal;
