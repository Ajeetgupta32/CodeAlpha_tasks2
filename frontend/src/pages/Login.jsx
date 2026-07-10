import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl, setUser } = useContext(ShopContext);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const [adminPassword, setAdminPassword] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (showAdminLogin) {
        // Use admin login flow if admin form is shown
        await adminLogin();
        return;
      }

      if (currentState === 'Sign Up') {
        const response = await axios.post(`${backendUrl}/api/user/register`, {
          name,
          email,
          password,
          role: 'user' // Default role
        });
        
        if (response.data.success) {
          setToken(response.data.token);
          setUser(response.data.user);
          localStorage.setItem('token', response.data.token);
          toast.success('Registration successful!');
          navigate('/');
        }
      } else {
        // Regular user login
        const response = await axios.post(`${backendUrl}/api/user/login`, {
          email,
          password
        });

        if (response.data.success) {
          handleLoginSuccess(response.data);
        }
      }
    } catch (error) {
      handleLoginError(error);
    }
  };

  const handleLoginSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    
    if (data.user.role === 'admin') {
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard');
      toast.success('Admin login successful!');
    } else {
      navigate('/');
      toast.success('Login successful!');
    }
  };

  const handleLoginError = (error) => {
    console.error('Login error:', error);
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Login failed. Please try again.';
    toast.error(errorMessage);
  };

  const adminLogin = async () => {
    try {
      const response = await axios.post(`${backendUrl}/api/admin/login`, {
        email: adminEmail,
        password: adminPassword
      });

      if (response.data.success) {
        handleLoginSuccess(response.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      handleLoginError(error);
    }
  };

  const toggleAdminLogin = () => {
    setShowAdminLogin(!showAdminLogin);
    // Clear form when toggling
    if (!showAdminLogin) {
      setEmail('');
      setPassword('');
    }
  };

  useEffect(() => {
    if (token) {
      const isAdmin = localStorage.getItem('isAdmin');
      navigate(isAdmin ? '/admin/dashboard' : '/');
    }
  }, [token, navigate]);

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>
          {showAdminLogin ? 'Admin Login' : currentState}
        </p>
        <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
      </div>

      {!showAdminLogin && currentState === 'Sign Up' && (
        <input 
          onChange={(e) => setName(e.target.value)} 
          value={name} 
          type="text" 
          className='w-full px-3 py-2 border border-gray-800' 
          placeholder='Name' 
          required
        />
      )}

      {showAdminLogin ? (
        <>
          <input 
            onChange={(e) => setAdminEmail(e.target.value)} 
            value={adminEmail}
            type="email" 
            className='w-full px-3 py-2 border border-gray-800' 
            placeholder='Admin Email' 
            required
          />
          <input 
            onChange={(e) => setAdminPassword(e.target.value)} 
            value={adminPassword}
            type="password" 
            className='w-full px-3 py-2 border border-gray-800' 
            placeholder='Admin Password' 
            required
          />
        </>
      ) : (
        <>
          <input 
            onChange={(e) => setEmail(e.target.value)} 
            value={email} 
            type="email" 
            className='w-full px-3 py-2 border border-gray-800' 
            placeholder='Email' 
            required
          />
          <input 
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
            type="password" 
            className='w-full px-3 py-2 border border-gray-800' 
            placeholder='Password' 
            required
          />
        </>
      )}

      <div className='w-full flex justify-between text-sm mt-[-8px]'>
        {!showAdminLogin && (
          <p className='cursor-pointer'>Forgot your password?</p>
        )}
        {!showAdminLogin && (
          currentState === 'Login' 
            ? <p onClick={() => setCurrentState('Sign Up')} className='cursor-pointer'>Create account</p>
            : <p onClick={() => setCurrentState('Login')} className='cursor-pointer'>Login Here</p>
        )}
      </div>

      <button type="submit" className='bg-black text-white font-light px-8 py-2 mt-4 w-full'>
        {showAdminLogin ? 'Admin Login' : (currentState === 'Login' ? 'Sign In' : 'Sign Up')}
      </button>

      <button 
        type="button"
        onClick={toggleAdminLogin}
        className={`text-sm ${showAdminLogin ? 'text-red-600' : 'text-gray-600'} underline cursor-pointer`}
      >
        {showAdminLogin ? '← Back to User Login' : 'Admin Login →'}
      </button>
    </form>
  );
};

export default Login;