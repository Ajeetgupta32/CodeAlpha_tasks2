import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import OrderTrackModal from '../components/OrderTrackModal';

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setorderData] = useState([]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const loadOrderData = async () => {
    try {
      if (!token) return null;

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
      if (response.data.success) {
        let allOrdersItem = [];
        response.data.orders.forEach((order) => {
          order.items.forEach((item) => {
            item['status'] = order.status;
            item['payment'] = order.payment;
            item['paymentMethod'] = order.paymentMethod;
            item['date'] = order.date;
            item['orderId'] = order._id;
            item['address'] = order.address;
            item['amount'] = order.amount;
            allOrdersItem.push(item);
          });
        });
        setorderData(allOrdersItem.reverse());
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div>
        {orderData.length === 0 ? (
          <div className='text-center py-20 text-gray-500'>
            <p className='text-lg font-medium mb-2'>You haven't placed any orders yet.</p>
            <p className='text-sm text-gray-400'>Browse our collections and place your first order!</p>
          </div>
        ) : (
          orderData.map((item, index) => {
            const isCancelled = item.status === 'Cancelled';
            const isReturn = item.status === 'Return Requested';

            return (
              <div
                key={index}
                className='py-5 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white hover:bg-gray-50/50 transition-colors'
              >
                <div className='flex items-start gap-6 text-sm'>
                  <img
                    className='w-16 sm:w-20 aspect-square rounded border object-cover bg-gray-50'
                    src={(Array.isArray(item.image) && item.image[0]) || (typeof item.image === 'string' && item.image) || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop'}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop';
                    }}
                  />
                  <div>
                    <p className='sm:text-base font-medium text-gray-900'>{item.name}</p>
                    <div className='flex items-center gap-3 mt-1 text-sm text-gray-600'>
                      <p className='font-semibold text-black'>{currency}{item.price}</p>
                      <p>Qty: {item.quantity}</p>
                      <p className='bg-gray-100 px-2 py-0.5 rounded text-xs'>Size: {item.size}</p>
                    </div>
                    <p className='mt-2 text-xs text-gray-500'>
                      Date: <span className='text-gray-700 font-medium'>{new Date(item.date).toDateString()}</span>
                    </p>
                    <p className='text-xs text-gray-500'>
                      Payment: <span className='text-gray-700 font-medium uppercase'>{item.paymentMethod}</span>
                    </p>
                  </div>
                </div>

                <div className='md:w-1/2 flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <span className={`w-2.5 h-2.5 rounded-full ${isCancelled ? 'bg-red-500' : isReturn ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></span>
                    <p className={`text-sm md:text-base font-medium ${isCancelled ? 'text-red-600' : isReturn ? 'text-amber-700' : 'text-gray-800'}`}>
                      {item.status}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setInvoiceOrder(item)}
                      className='border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 rounded hover:bg-gray-100 transition-colors flex items-center gap-1.5'
                      title="View / Print Tax Invoice"
                    >
                      <svg className='w-3.5 h-3.5 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' />
                      </svg>
                      Invoice
                    </button>
                    <button
                      onClick={() => setActiveTrackingOrder({ _id: item.orderId, status: item.status, name: item.name, image: item.image, price: item.price, size: item.size, quantity: item.quantity })}
                      className='border border-gray-300 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded hover:bg-black hover:text-white transition-colors'
                    >
                      Track
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Tracking, Cancellation & Return Modal */}
      <OrderTrackModal
        isOpen={Boolean(activeTrackingOrder)}
        onClose={() => setActiveTrackingOrder(null)}
        order={activeTrackingOrder}
        backendUrl={backendUrl}
        token={token}
        onOrderUpdated={loadOrderData}
      />

      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative'>
            <div className='flex items-center justify-between pb-3 border-b'>
              <div>
                <h3 className='text-lg font-bold tracking-tight text-gray-900'>NEXUS RETAIL INVOICE</h3>
                <p className='text-[11px] text-gray-500'>Order Reference #{invoiceOrder.orderId}</p>
              </div>
              <button
                onClick={() => setInvoiceOrder(null)}
                className='text-gray-400 hover:text-black text-xl font-bold w-7 h-7 flex items-center justify-center'
              >
                &times;
              </button>
            </div>

            <div className='mt-4 text-xs space-y-3'>
              <div className='grid grid-cols-2 gap-4 pb-3 border-b'>
                <div>
                  <p className='text-gray-400 font-semibold uppercase text-[10px]'>Sold By</p>
                  <p className='font-bold text-gray-800 text-sm'>NEXUS Retail Technologies Inc.</p>
                  <p className='text-gray-500'>124 Commercial Avenue</p>
                  <p className='text-gray-500'>Tax ID / GSTIN: 29ABCDE1234F1Z5</p>
                </div>
                <div className='text-right'>
                  <p className='text-gray-400 font-semibold uppercase text-[10px]'>Order Info</p>
                  <p className='font-semibold text-gray-800'>Date: {new Date(invoiceOrder.date).toLocaleDateString()}</p>
                  <p className='text-gray-500'>Payment: <span className='uppercase font-semibold'>{invoiceOrder.paymentMethod}</span></p>
                  <p className='text-gray-500'>Status: <span className='font-semibold'>{invoiceOrder.status}</span></p>
                </div>
              </div>

              {invoiceOrder.address && (
                <div className='pb-3 border-b'>
                  <p className='text-gray-400 font-semibold uppercase text-[10px]'>Shipping Address</p>
                  <p className='font-semibold text-gray-800'>
                    {invoiceOrder.address.firstName} {invoiceOrder.address.lastName}
                  </p>
                  <p className='text-gray-500'>{invoiceOrder.address.street}</p>
                  <p className='text-gray-500'>
                    {invoiceOrder.address.city}, {invoiceOrder.address.state} {invoiceOrder.address.zipcode}
                  </p>
                  <p className='text-gray-500'>Phone: {invoiceOrder.address.phone}</p>
                </div>
              )}

              {/* Itemized Table */}
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='border-b bg-gray-50 text-gray-600 text-[11px]'>
                    <th className='py-2 px-2'>Item Description</th>
                    <th className='py-2 px-2 text-center'>Size</th>
                    <th className='py-2 px-2 text-center'>Qty</th>
                    <th className='py-2 px-2 text-right'>Amount</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  <tr>
                    <td className='py-2 px-2 font-medium text-gray-900'>{invoiceOrder.name}</td>
                    <td className='py-2 px-2 text-center'>{invoiceOrder.size}</td>
                    <td className='py-2 px-2 text-center'>{invoiceOrder.quantity}</td>
                    <td className='py-2 px-2 text-right font-medium'>{currency}{invoiceOrder.price * invoiceOrder.quantity}</td>
                  </tr>
                </tbody>
              </table>

              <div className='pt-3 border-t space-y-1.5 text-right'>
                <div className='flex justify-between text-gray-600'>
                  <span>Items Subtotal:</span>
                  <span>{currency}{invoiceOrder.price * invoiceOrder.quantity}</span>
                </div>
                <div className='flex justify-between text-gray-600'>
                  <span>Shipping / Delivery:</span>
                  <span>{currency}0.00 (Standard)</span>
                </div>
                <div className='flex justify-between font-bold text-sm text-gray-900 pt-1 border-t'>
                  <span>Total Paid:</span>
                  <span>{currency}{invoiceOrder.amount || invoiceOrder.price * invoiceOrder.quantity}</span>
                </div>
              </div>

              <div className='mt-5 pt-3 border-t flex items-center justify-between'>
                <span className='text-[10px] text-gray-400'>
                  Thank you for shopping with NEXUS!
                </span>
                <button
                  type='button'
                  onClick={handlePrint}
                  className='px-4 py-2 bg-black text-white rounded text-xs font-semibold hover:bg-gray-800 transition flex items-center gap-1.5'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' />
                  </svg>
                  Print / Save Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
