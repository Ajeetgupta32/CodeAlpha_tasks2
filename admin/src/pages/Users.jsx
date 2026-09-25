import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const Users = ({ token }) => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${backendUrl}/api/admin/users`, {
        headers: { token }
      })
      if (response.data.success) {
        setUsers(response.data.users)
        setFilteredUsers(response.data.users)
      } else {
        toast.error(response.data.message || 'Failed to fetch users')
      }
    } catch (error) {
      console.error(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchUsers()
  }, [token])

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase()
      setFilteredUsers(
        users.filter(
          u =>
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.phone && u.phone.includes(q))
        )
      )
    } else {
      setFilteredUsers(users)
    }
  }, [search, users])

  return (
    <div className='flex flex-col gap-6 pr-4 sm:pr-8'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800 tracking-tight'>Customer & User Accounts</h1>
          <p className='text-sm text-gray-500 mt-1'>
            Manage registered store shoppers, lifetime spending, and loyalty reward points
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-gray-100 transition w-fit'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
          </svg>
          Refresh Users
        </button>
      </div>

      {/* Search Input */}
      <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between'>
        <div className='relative w-full sm:w-80'>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search user by name, email, or phone...'
            className='w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded focus:outline-black'
          />
          <svg className='w-4 h-4 text-gray-400 absolute left-3 top-2.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
          </svg>
        </div>
        <span className='text-xs text-gray-500 font-medium'>
          Total Registered: <b className='text-gray-900'>{users.length}</b>
        </span>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
        {loading ? (
          <div className='p-12 text-center text-gray-500'>Loading customer accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className='p-12 text-center text-gray-400'>No users found.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-gray-50 text-gray-600 uppercase font-semibold border-b'>
                <tr>
                  <th className='py-3 px-4'>User</th>
                  <th className='py-3 px-3'>Email</th>
                  <th className='py-3 px-3'>Phone</th>
                  <th className='py-3 px-3 text-center'>Role</th>
                  <th className='py-3 px-3 text-center'>Orders</th>
                  <th className='py-3 px-3 text-right'>Total Spent</th>
                  <th className='py-3 px-3 text-center'>Rewards</th>
                  <th className='py-3 px-4'>Joined</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className='hover:bg-gray-50/80 transition'>
                    <td className='py-3.5 px-4'>
                      <div className='flex items-center gap-2.5'>
                        <div className='w-8 h-8 rounded-full bg-black text-white font-bold flex items-center justify-center text-xs flex-shrink-0'>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900'>{u.name}</p>
                          <span className='text-[10px] text-gray-400'>ID #{u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className='py-3.5 px-3 text-gray-600'>{u.email}</td>
                    <td className='py-3.5 px-3 text-gray-500'>{u.phone || 'N/A'}</td>
                    <td className='py-3.5 px-3 text-center'>
                      <span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 capitalize'>
                        {u.role || 'customer'}
                      </span>
                    </td>
                    <td className='py-3.5 px-3 text-center font-semibold text-gray-800'>
                      {u.order_count || 0}
                    </td>
                    <td className='py-3.5 px-3 text-right font-bold text-gray-900'>
                      {currency}{Number(u.total_spent || 0).toLocaleString()}
                    </td>
                    <td className='py-3.5 px-3 text-center'>
                      <span className='px-2 py-0.5 rounded font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200'>
                        {u.rewardPoints || 0} pts
                      </span>
                    </td>
                    <td className='py-3.5 px-4 text-gray-400 text-[11px]'>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Users
