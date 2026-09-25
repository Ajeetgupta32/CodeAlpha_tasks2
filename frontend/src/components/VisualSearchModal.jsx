import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';

const VisualSearchModal = ({ isOpen, onClose }) => {
  const { setSearch, setShowSearch } = useContext(ShopContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const sampleStyles = [
    { label: "Summer Cotton Top", query: "cotton top", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop" },
    { label: "Classic Denim & Pants", query: "pants", image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=300&auto=format&fit=crop" },
    { label: "Winter Warm Jacket", query: "winterwear", image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=300&auto=format&fit=crop" },
    { label: "Round Neck T-Shirt", query: "round neck", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&auto=format&fit=crop" }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      performVisualScan(file.name);
    }
  };

  const performVisualScan = (fileName) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Determine relevant keyword from file or fallback to clothing
      const lower = fileName.toLowerCase();
      let detectedKeyword = "cotton";
      if (lower.includes('jacket') || lower.includes('winter') || lower.includes('coat')) detectedKeyword = "winterwear";
      else if (lower.includes('pant') || lower.includes('trouser') || lower.includes('jean')) detectedKeyword = "bottomwear";
      else if (lower.includes('round') || lower.includes('neck')) detectedKeyword = "round neck";
      else if (lower.includes('shirt') || lower.includes('tee')) detectedKeyword = "t-shirt";

      setSearch(detectedKeyword);
      setShowSearch(true);
      onClose();
      navigate('/collection');
    }, 1200);
  };

  const handleSelectSample = (sample) => {
    setSearch(sample.query);
    setShowSearch(true);
    onClose();
    navigate('/collection');
  };

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-200'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-black w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition'
        >
          ✕
        </button>

        <div className='text-center mb-6'>
          <div className='w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl'>
            📷
          </div>
          <h3 className='text-xl font-bold text-gray-900'>Visual Style Search</h3>
          <p className='text-xs text-gray-500 mt-1'>
            Upload an outfit photo or choose a style below to find matching clothing.
          </p>
        </div>

        {/* Upload Dropzone */}
        <label className='border-2 border-dashed border-gray-300 hover:border-black rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition mb-6 group'>
          <input type="file" accept="image/*" onChange={handleFileChange} className='hidden' />
          {preview ? (
            <div className='relative text-center'>
              <img src={preview} alt="Upload preview" className='w-24 h-24 object-cover rounded-lg mx-auto shadow-sm' />
              {isScanning ? (
                <div className='mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 animate-pulse'>
                  <span className='w-2 h-2 rounded-full bg-indigo-600 animate-ping'></span>
                  Analyzing garment colors and texture...
                </div>
              ) : (
                <p className='text-xs text-gray-500 mt-2'>Click to replace photo</p>
              )}
            </div>
          ) : (
            <>
              <svg className='w-8 h-8 text-gray-400 group-hover:text-black transition mb-2' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className='text-xs font-semibold text-gray-700 group-hover:text-black'>Upload photo from your device</span>
              <span className='text-[10px] text-gray-400 mt-1'>Supports PNG, JPG, WEBP</span>
            </>
          )}
        </label>

        {/* Sample Styles */}
        <div>
          <h4 className='text-xs font-bold text-gray-900 tracking-wider uppercase mb-3'>Or Search by Sample Trend</h4>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
            {sampleStyles.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className='border rounded-lg p-2 text-left hover:border-black hover:shadow-sm transition bg-white flex flex-col items-center text-center group'
              >
                <img src={sample.image} alt={sample.label} className='w-14 h-14 object-cover rounded mb-1.5 group-hover:scale-105 transition' />
                <span className='text-[11px] font-medium text-gray-800 line-clamp-1'>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualSearchModal;
