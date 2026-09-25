import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'

const SellerPortal = ({ token }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Seller store mock profile (integrated with PostgreSQL products)
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'NEXUS Signature Collection',
    merchantId: 'MKT-89421',
    category: 'Apparel & Fashion',
    rating: '4.85 ★',
    status: 'Verified Merchant',
    payoutAccount: 'HDFC Bank **** 4819'
  })

  const fetchSellerData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/product/list`)
      if (res.data.success) {
        setProducts(res.data.products || [])
      }
    } catch (err) {
      console.error(err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSellerData()
  }, [])

  const totalCatalogValue = products.reduce((acc, p) => acc + (Number(p.price) * (Number(p.stock) || 50)), 0)
  const lowStockItems = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 10)

  return (
    <div className='flex flex-col gap-6 pr-4 sm:pr-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-gray-800 tracking-tight'>Multi-Vendor Seller Portal</h1>
            <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800'>
              {storeInfo.status}
            </span>
          </div>
          <p className='text-sm text-gray-500 mt-1'>
            {storeInfo.storeName} &bull; Merchant ID: <span className='font-mono font-bold text-gray-700'>{storeInfo.merchantId}</span>
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Link
            to='/add'
            className='px-4 py-2 bg-black text-white text-xs font-semibold rounded hover:bg-gray-800 transition shadow-xs'
          >
            + Add New Listing
          </Link>
        </div>
      </div>

      {/* Seller KPI Metric Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm'>
          <p className='text-xs font-semibold uppercase text-gray-500'>Estimated Catalog Value</p>
          <h3 className='text-2xl font-bold text-gray-900 mt-1'>
            {currency}{totalCatalogValue.toLocaleString()}
          </h3>
          <span className='text-xs text-gray-400 mt-1 block'>Across {products.length} listed items</span>
        </div>

        <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm'>
          <p className='text-xs font-semibold uppercase text-gray-500'>Active Listings</p>
          <h3 className='text-2xl font-bold text-gray-900 mt-1'>{products.length} Products</h3>
          <Link to='/list' className='text-xs text-blue-600 hover:underline mt-1 block'>
            View catalog list &rarr;
          </Link>
        </div>

        <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm'>
          <p className='text-xs font-semibold uppercase text-gray-500'>Low Stock Alerts</p>
          <h3 className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {lowStockItems.length}
          </h3>
          <Link to='/inventory' className='text-xs text-blue-600 hover:underline mt-1 block'>
            Adjust inventory &rarr;
          </Link>
        </div>

        <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm'>
          <p className='text-xs font-semibold uppercase text-gray-500'>Seller Performance Rating</p>
          <h3 className='text-2xl font-bold text-amber-600 mt-1'>{storeInfo.rating}</h3>
          <span className='text-xs text-emerald-600 mt-1 block font-medium'>Top Rated Merchant</span>
        </div>
      </div>

      {/* Seller Info & Payouts banner */}
      <div className='bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4'>
        <div>
          <span className='text-[10px] uppercase font-bold tracking-wider text-gray-400'>Settlements & Payouts</span>
          <h4 className='text-lg font-bold mt-0.5'>Bi-weekly Automated Bank Transfer Active</h4>
          <p className='text-xs text-gray-300 mt-1'>
            Linked Payout Account: <span className='font-mono font-semibold'>{storeInfo.payoutAccount}</span> &bull; Next cycle: 1st of next month
          </p>
        </div>
        <button
          onClick={() => toast.info(`Payout account ${storeInfo.payoutAccount} is active and verified!`)}
          className='px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-100 transition whitespace-nowrap'
        >
          Manage Payout Account
        </button>
      </div>

      {/* Vendor Top Items Quick Table */}
      <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-base font-semibold text-gray-800'>Your Top Selling Listings</h2>
          <Link to='/inventory' className='text-xs font-medium text-blue-600 hover:underline'>
            Manage full stock &rarr;
          </Link>
        </div>

        {loading ? (
          <div className='py-8 text-center text-gray-500'>Loading seller catalog...</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-gray-50 text-gray-600 uppercase font-semibold border-b'>
                <tr>
                  <th className='py-3 px-3'>Product</th>
                  <th className='py-3 px-3'>Category</th>
                  <th className='py-3 px-3'>Price</th>
                  <th className='py-3 px-3 text-center'>Current Stock</th>
                  <th className='py-3 px-3 text-center'>Bestseller</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {products.slice(0, 6).map((item) => (
                  <tr key={item._id || item.id} className='hover:bg-gray-50 transition'>
                    <td className='py-3 px-3 flex items-center gap-3'>
                      <img
                        src={Array.isArray(item.image) ? item.image[0] : item.image}
                        alt=""
                        className='w-9 h-9 object-cover rounded border'
                      />
                      <span className='font-semibold text-gray-900 truncate max-w-[200px]'>{item.name}</span>
                    </td>
                    <td className='py-3 px-3 capitalize text-gray-600'>{item.category}</td>
                    <td className='py-3 px-3 font-bold text-gray-900'>{currency}{item.price}</td>
                    <td className='py-3 px-3 text-center'>
                      <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                        (item.stock || 50) <= 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.stock || 50} units
                      </span>
                    </td>
                    <td className='py-3 px-3 text-center'>
                      {item.bestseller ? <span className='text-amber-500 font-bold'>★ Yes</span> : <span className='text-gray-400'>No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Product Q&A Moderation Queue */}
      <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm'>
        <div className='flex items-center justify-between mb-3'>
          <div>
            <h2 className='text-base font-semibold text-gray-800'>Customer Questions & Inquiries</h2>
            <p className='text-xs text-gray-500'>Answer inquiries directly to boost your product conversion rate</p>
          </div>
          <span className='text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full'>
            Verified Merchant Replies
          </span>
        </div>

        <div className='space-y-3 mt-4'>
          <div className='p-3.5 border rounded-lg bg-gray-50 text-xs space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-bold text-gray-900'>Q: Is the fabric pure cotton and pre-shrunk for machine washing?</span>
              <span className='text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded'>Answered</span>
            </div>
            <p className='text-gray-600 italic bg-white p-2.5 rounded border'>
              "Yes! It is crafted with 100% combed cotton, extremely breathable, and pre-shrunk to retain exact sizing through washes." — <b>{storeInfo.storeName}</b>
            </p>
          </div>

          <div className='p-3.5 border rounded-lg bg-gray-50 text-xs space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='font-bold text-gray-900'>Q: Do you offer express next-day delivery on bulk orders?</span>
              <span className='text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded'>New Question</span>
            </div>
            <p className='text-gray-600 italic bg-white p-2.5 rounded border'>
              "Yes, select Express 2-Day at checkout or contact our seller support for customized bulk order shipments." — <b>{storeInfo.storeName}</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerPortal
