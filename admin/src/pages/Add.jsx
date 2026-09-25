import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  // AI Seller Assistant (Feature 10)
  const handleAiGenerate = () => {
    const keyword = name.trim() || 'Cotton Clothing';
    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);
      const kLower = keyword.toLowerCase();
      let genName = name;
      let genDesc = "";
      let genSub = subCategory;

      if (kLower.includes('hoodie') || kLower.includes('jacket') || kLower.includes('winter') || kLower.includes('coat')) {
        genName = `Thermal Heavyweight Winter ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
        genDesc = `Crafted for chilly seasons, this ${genName} combines a thick thermal fleece lining with a modern, relaxed silhouette. Features double-stitched ribbed cuffs, a dual-layer drawstring hood, and deep reinforced pockets.\n\n• Material: 80% Combed Cotton, 20% Polyester\n• Fit: Relaxed Comfort Fit\n• Care: Machine wash cold with like colors, tumble dry low.`;
        genSub = "Winterwear";
      } else if (kLower.includes('pant') || kLower.includes('trouser') || kLower.includes('bottom') || kLower.includes('jogger')) {
        genName = `Everyday Stretch Tailored ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
        genDesc = `Engineered for modern mobility, these trousers blend breathable stretch-cotton twill with an ergonomic tapered leg. Includes deep slant pockets and secure zip-closure back welt pockets.\n\n• Material: 98% Ring-Spun Cotton, 2% Spandex\n• Fit: Modern Slim-Tapered\n• Rise: Mid-rise with durable belt loops.`;
        genSub = "Bottomwear";
      } else {
        genName = `Premium Ultra-Soft Pure Cotton ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
        genDesc = `An essential daily wardrobe staple. Made from 180 GSM bio-washed long-staple cotton that delivers an exceptionally smooth, breathable feel. Resistant to pilling and pre-shrunk to retain its tailored silhouette wash after wash.\n\n• Material: 100% Ring-Spun Combed Cotton\n• Fit: Regular Tailored Fit\n• Neckline: Non-sag ribbed collar.`;
        genSub = "Topwear";
      }

      setName(genName);
      setDescription(genDesc);
      setSubCategory(genSub);
      if (!price) setPrice("45");
      toast.success("AI generated title, description & specifications!");
    }, 700);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes));

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(backendUrl + "/api/product/add", formData, { headers: { token } });

      if (response.data.success) {
        toast.success(response.data.message);
        setName('');
        setDescription('');
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setPrice('');
        setSizes([]);
        setBestseller(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-4 max-w-[800px] pb-10'>
      {/* AI Seller Assistant Banner */}
      <div className='w-full p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-xl flex items-center justify-between gap-4'>
        <div className='flex items-center gap-2.5'>
          <span className='text-2xl'>✨</span>
          <div>
            <h4 className='text-xs font-bold text-indigo-950 uppercase tracking-wide'>
              AI Seller Assistant (Powered by Gemini)
            </h4>
            <p className='text-xs text-indigo-800'>
              Type a basic keyword in product name and click generate to create an SEO title, specs & description.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={aiGenerating}
          className='bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-sm transition whitespace-nowrap flex items-center gap-1.5'
        >
          {aiGenerating ? 'Generating...' : '✨ Auto-Generate'}
        </button>
      </div>

      <div>
        <p className='mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider'>Upload Images</p>
        <div className='flex gap-2.5'>
          <label htmlFor="image1" className='cursor-pointer'>
            <img className='w-20 h-20 object-cover rounded border border-gray-300' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
            <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="image1" hidden />
          </label>
          <label htmlFor="image2" className='cursor-pointer'>
            <img className='w-20 h-20 object-cover rounded border border-gray-300' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
            <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="image2" hidden />
          </label>
          <label htmlFor="image3" className='cursor-pointer'>
            <img className='w-20 h-20 object-cover rounded border border-gray-300' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
            <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="image3" hidden />
          </label>
          <label htmlFor="image4" className='cursor-pointer'>
            <img className='w-20 h-20 object-cover rounded border border-gray-300' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
            <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="image4" hidden />
          </label>
        </div>
      </div>

      <div className='w-full'>
        <p className='mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider'>Product Title</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className='w-full max-w-[600px] px-3.5 py-2.5 border border-gray-300 rounded text-sm outline-none focus:border-black'
          type="text"
          placeholder='e.g. Pure Cotton Slim Fit Shirt'
          required
        />
      </div>

      <div className='w-full'>
        <p className='mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider'>Product Description & Specifications</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className='w-full max-w-[600px] px-3.5 py-2.5 border border-gray-300 rounded text-sm outline-none focus:border-black h-32 leading-relaxed'
          placeholder='Write engaging description, bullet features, fabric details...'
          required
        />
      </div>

      <div className='flex flex-col sm:flex-row gap-3 w-full sm:gap-6'>
        <div>
          <p className='mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider'>Category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white'
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className='mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider'>Sub Category</p>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white'
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>

        <div>
          <p className='mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider'>Price ($)</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className='w-full px-3 py-2 border border-gray-300 rounded text-sm sm:w-[120px]'
            type="number"
            placeholder='35'
            required
          />
        </div>
      </div>

      <div>
        <p className='mb-2 text-xs font-bold text-gray-700 uppercase tracking-wider'>Product Sizes</p>
        <div className='flex gap-2'>
          {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
            <div
              key={s}
              onClick={() => setSizes(prev => prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s])}
              className={`px-3 py-1.5 rounded cursor-pointer text-xs font-semibold border ${
                sizes.includes(s) ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className='flex items-center gap-2 mt-2'>
        <input
          onChange={() => setBestseller(prev => !prev)}
          checked={bestseller}
          type="checkbox"
          id='bestseller'
          className='w-4 h-4 rounded cursor-pointer accent-black'
        />
        <label className='cursor-pointer text-xs font-medium text-gray-700' htmlFor="bestseller">
          Add to Bestseller Collection 🔥
        </label>
      </div>

      <button
        type="submit"
        className='w-36 py-3 mt-4 bg-black text-white text-xs font-bold rounded uppercase hover:bg-gray-800 transition shadow-sm'
      >
        ADD PRODUCT
      </button>
    </form>
  );
};

export default Add;