import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const Inventory = ({ token }) => {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // all, low, out, bestseller
  const [updatingId, setUpdatingId] = useState(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${backendUrl}/api/product/list`)
      if (response.data.success) {
        // Ensure every item has stock property default to 50 if null
        const items = response.data.products.map(p => ({
          ...p,
          stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 50,
          inStock: p.inStock !== undefined ? Boolean(p.inStock) : true,
          editPrice: p.price,
          editStock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 50,
          editBestseller: Boolean(p.bestseller),
          editInStock: p.inStock !== undefined ? Boolean(p.inStock) : true
        }))
        setProducts(items)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    let result = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q))
      )
    }

    if (filterType === 'low') {
      result = result.filter(p => Number(p.editStock) > 0 && Number(p.editStock) <= 10)
    } else if (filterType === 'out') {
      result = result.filter(p => Number(p.editStock) <= 0 || !p.editInStock)
    } else if (filterType === 'bestseller') {
      result = result.filter(p => p.editBestseller)
    }

    setFiltered(result)
  }, [products, search, filterType])

  const handleFieldChange = (id, field, value) => {
    setProducts(products.map(p => {
      if (p.id === id || p._id === id) {
        return { ...p, [field]: value }
      }
      return p
    }))
  }

  const handleStockDelta = (id, delta) => {
    setProducts(products.map(p => {
      if (p.id === id || p._id === id) {
        const next = Math.max(0, Number(p.editStock) + delta)
        return { ...p, editStock: next, editInStock: next > 0 }
      }
      return p
    }))
  }

  const handleSaveRow = async (item) => {
    const productId = item.id || item._id
    try {
      setUpdatingId(productId)
      const response = await axios.post(
        `${backendUrl}/api/admin/inventory/update`,
        {
          id: productId,
          stock: Number(item.editStock),
          price: Number(item.editPrice),
          bestseller: Boolean(item.editBestseller),
          inStock: Boolean(item.editInStock && Number(item.editStock) > 0)
        },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success(`Updated "${item.name}" inventory`)
        setProducts(products.map(p => {
          if ((p.id || p._id) === productId) {
            return {
              ...p,
              stock: Number(item.editStock),
              price: Number(item.editPrice),
              bestseller: Boolean(item.editBestseller),
              inStock: Boolean(item.editInStock && Number(item.editStock) > 0)
            }
          }
          return p
        }))
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className='flex flex-col gap-6 pr-4 sm:pr-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800 tracking-tight'>Inventory & Stock Control</h1>
          <p className='text-sm text-gray-500 mt-1'>
            Manage product quantities, low-stock thresholds, bestseller status, and retail prices
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-100 transition w-fit'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
          </svg>
          Refresh Inventory
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between'>
        <div className='relative w-full md:w-80'>
          <input
            type='text'
            placeholder='Search products or category...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded focus:outline-black'
          />
          <svg className='w-4 h-4 text-gray-400 absolute left-3 top-2.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
          </svg>
        </div>

        <div className='flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs'>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              filterType === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              filterType === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Low Stock (≤ 10)
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              filterType === 'out'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
            }`}
          >
            Out of Stock
          </button>
          <button
            onClick={() => setFilterType('bestseller')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              filterType === 'bestseller'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            ★ Bestsellers
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
        {loading ? (
          <div className='p-12 text-center text-gray-500'>Loading inventory catalog...</div>
        ) : filtered.length === 0 ? (
          <div className='p-12 text-center text-gray-400'>No products match your search or filter.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-gray-50 text-gray-600 uppercase font-semibold border-b'>
                <tr>
                  <th className='py-3 px-4'>Item</th>
                  <th className='py-3 px-3'>Category</th>
                  <th className='py-3 px-3'>Price ({currency})</th>
                  <th className='py-3 px-3'>Stock Count</th>
                  <th className='py-3 px-3 text-center'>Status</th>
                  <th className='py-3 px-3 text-center'>Bestseller</th>
                  <th className='py-3 px-4 text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {filtered.map((item) => {
                  const id = item.id || item._id
                  const isModified =
                    item.editPrice !== item.price ||
                    item.editStock !== item.stock ||
                    item.editBestseller !== item.bestseller ||
                    item.editInStock !== item.inStock

                  const isLow = Number(item.editStock) > 0 && Number(item.editStock) <= 10
                  const isOut = Number(item.editStock) <= 0 || !item.editInStock

                  return (
                    <tr key={id} className={`hover:bg-gray-50/80 transition ${isOut ? 'bg-red-50/30' : ''}`}>
                      {/* Product Thumbnail & Name */}
                      <td className='py-3 px-4 flex items-center gap-3'>
                        <img
                          src={Array.isArray(item.image) ? item.image[0] : item.image}
                          alt={item.name}
                          className='w-10 h-10 object-cover rounded border'
                        />
                        <div className='truncate max-w-[200px]'>
                          <p className='font-semibold text-gray-900 truncate'>{item.name}</p>
                          <span className='text-[10px] text-gray-400'>ID: #{id}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className='py-3 px-3'>
                        <span className='capitalize font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded'>
                          {item.category}
                        </span>
                      </td>

                      {/* Price Edit */}
                      <td className='py-3 px-3'>
                        <div className='flex items-center gap-1'>
                          <span className='text-gray-500 font-medium'>{currency}</span>
                          <input
                            type='number'
                            value={item.editPrice}
                            onChange={(e) => handleFieldChange(id, 'editPrice', e.target.value)}
                            className='w-20 px-2 py-1 border border-gray-300 rounded font-medium focus:outline-black text-xs'
                            min='1'
                          />
                        </div>
                      </td>

                      {/* Stock Stepper */}
                      <td className='py-3 px-3'>
                        <div className='flex items-center gap-1.5'>
                          <button
                            type='button'
                            onClick={() => handleStockDelta(id, -1)}
                            className='w-6 h-6 rounded bg-gray-100 border text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center'
                          >
                            -
                          </button>
                          <input
                            type='number'
                            value={item.editStock}
                            onChange={(e) => handleFieldChange(id, 'editStock', Math.max(0, Number(e.target.value)))}
                            className='w-16 px-2 py-1 border border-gray-300 rounded text-center font-bold focus:outline-black text-xs'
                            min='0'
                          />
                          <button
                            type='button'
                            onClick={() => handleStockDelta(id, 1)}
                            className='w-6 h-6 rounded bg-gray-100 border text-gray-700 font-bold hover:bg-gray-200 flex items-center justify-center'
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className='py-3 px-3 text-center'>
                        {isOut ? (
                          <span className='inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800'>
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className='inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800'>
                            Low Stock ({item.editStock})
                          </span>
                        ) : (
                          <span className='inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800'>
                            In Stock ({item.editStock})
                          </span>
                        )}
                      </td>

                      {/* Bestseller Checkbox */}
                      <td className='py-3 px-3 text-center'>
                        <input
                          type='checkbox'
                          checked={item.editBestseller}
                          onChange={(e) => handleFieldChange(id, 'editBestseller', e.target.checked)}
                          className='w-4 h-4 cursor-pointer accent-black'
                        />
                      </td>

                      {/* Save Action */}
                      <td className='py-3 px-4 text-right'>
                        <button
                          onClick={() => handleSaveRow(item)}
                          disabled={updatingId === id || !isModified}
                          className={`px-3 py-1 rounded text-xs font-semibold transition ${
                            isModified
                              ? 'bg-black text-white hover:bg-gray-800 shadow-sm'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {updatingId === id ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory
