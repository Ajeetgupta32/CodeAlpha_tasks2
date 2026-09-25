import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const Coupons = ({ token }) => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [code, setCode] = useState('')
  const [type, setType] = useState('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('0')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${backendUrl}/api/admin/coupons`, {
        headers: { token }
      })
      if (response.data.success) {
        setCoupons(response.data.coupons)
      } else {
        toast.error(response.data.message || 'Failed to fetch coupons')
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchCoupons()
    }
  }, [token])

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    if (!code.trim() || !value) {
      toast.error('Please enter coupon code and discount value')
      return
    }

    try {
      setSubmitting(true)
      const response = await axios.post(
        `${backendUrl}/api/admin/coupon/add`,
        {
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          minOrder: Number(minOrder || 0),
          description: description.trim()
        },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success(response.data.message || 'Coupon created successfully')
        setCode('')
        setValue('')
        setDescription('')
        setMinOrder('0')
        fetchCoupons()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/admin/coupon/toggle`,
        { id },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this coupon?')) return
    try {
      const response = await axios.post(
        `${backendUrl}/api/admin/coupon/delete`,
        { id },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success(response.data.message)
        setCoupons(coupons.filter(c => c.id !== id))
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.info(`Copied "${text}" to clipboard!`)
  }

  return (
    <div className='flex flex-col gap-6 pr-4 sm:pr-8'>
      {/* Page Header */}
      <div className='pb-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold text-gray-800 tracking-tight'>Coupon & Promotion Codes</h1>
        <p className='text-sm text-gray-500 mt-1'>
          Create and manage customer discounts, flash promotional codes, and checkout incentives
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Col: Create New Coupon Form */}
        <div className='bg-white p-5 rounded-lg border border-gray-200 shadow-sm h-fit'>
          <h2 className='text-base font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <svg className='w-5 h-5 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
            </svg>
            Create New Coupon
          </h2>

          <form onSubmit={handleCreateCoupon} className='flex flex-col gap-4 text-sm'>
            <div>
              <label className='block font-medium text-gray-700 mb-1'>Coupon Code</label>
              <input
                type='text'
                placeholder='e.g. SUMMER30'
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className='w-full px-3 py-2 border border-gray-300 rounded font-mono uppercase tracking-wider focus:outline-black'
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block font-medium text-gray-700 mb-1'>Discount Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-black'
                >
                  <option value='percent'>Percentage (%)</option>
                  <option value='flat'>Flat Amount ({currency})</option>
                </select>
              </div>

              <div>
                <label className='block font-medium text-gray-700 mb-1'>
                  {type === 'percent' ? 'Discount %' : `Amount (${currency})`}
                </label>
                <input
                  type='number'
                  placeholder={type === 'percent' ? '20' : '50'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-black'
                  min='1'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block font-medium text-gray-700 mb-1'>
                Minimum Order Value ({currency})
              </label>
              <input
                type='number'
                placeholder='0'
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-black'
                min='0'
              />
              <span className='text-[11px] text-gray-400'>0 means applies with no minimum</span>
            </div>

            <div>
              <label className='block font-medium text-gray-700 mb-1'>Offer Description</label>
              <input
                type='text'
                placeholder='e.g. Extra 20% off on all collections'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-black'
              />
            </div>

            <button
              type='submit'
              disabled={submitting}
              className='w-full py-2.5 bg-black text-white rounded font-medium hover:bg-gray-800 transition disabled:opacity-50 mt-2'
            >
              {submitting ? 'Creating...' : '+ Create Coupon'}
            </button>
          </form>
        </div>

        {/* Right Col: Active and Past Coupons List */}
        <div className='lg:col-span-2 flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-base font-semibold text-gray-800'>
              Configured Promo Coupons ({coupons.length})
            </h2>
            <button
              onClick={fetchCoupons}
              className='text-xs text-gray-500 hover:text-black flex items-center gap-1'
            >
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className='bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500'>
              Loading promo coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className='bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-400'>
              No coupons created yet. Use the form on the left to add your first promotion.
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className={`bg-white p-4 rounded-lg border transition ${
                    coupon.isActive
                      ? 'border-gray-200 hover:border-gray-300 shadow-sm'
                      : 'border-dashed border-gray-300 opacity-60 bg-gray-50'
                  }`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono font-bold text-base tracking-wider text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-300'>
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          title='Copy code'
                          className='text-gray-400 hover:text-black transition'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                          </svg>
                        </button>
                      </div>
                      <p className='text-xs text-gray-600 font-medium mt-2'>
                        {coupon.description || 'Special store discount'}
                      </p>
                    </div>

                    <div className='text-right'>
                      <span className='text-lg font-extrabold text-emerald-600 block'>
                        {coupon.type === 'percent' ? `${coupon.value}% OFF` : `${currency}${coupon.value} FLAT`}
                      </span>
                      {Number(coupon.minOrder) > 0 && (
                        <span className='text-[10px] text-gray-500 block'>
                          Min: {currency}{coupon.minOrder}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          coupon.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></span>
                      <span className='text-gray-600 font-medium'>
                        {coupon.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleToggle(coupon.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                          coupon.isActive
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {coupon.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className='px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Coupons
