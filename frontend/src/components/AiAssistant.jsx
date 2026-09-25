import React, { useState, useContext, useRef, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AiAssistant = () => {
  const { products, currency, addToCart, backendUrl } = useContext(ShopContext);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'ai',
      text: "👋 Hi! I'm your AI Shopping Assistant. Ask me anything about our clothing styles, sizing, price recommendations, or outfit ideas!",
      recommendations: []
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "🔥 Best deals under $60",
    "👕 Men pure cotton t-shirts",
    "👗 Trending women wear",
    "❄️ Cozy winterwear"
  ];

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = { id: 'u_' + Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      await generateAiResponse(query);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAiResponse = async (query) => {
    try {
      const res = await axios.post(`${backendUrl}/api/product/ai-search`, { prompt: query });
      if (res.data.success && Array.isArray(res.data.products) && res.data.products.length > 0) {
        const aiMsg = {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: res.data.explanation,
          recommendations: res.data.products.slice(0, 4)
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }
    } catch (err) {
      console.warn("AI search backend error, using local fallback:", err);
    }
    const q = query.toLowerCase();
    let matching = [];
    let responseText = "";

    if (q.includes('under') || q.includes('cheap') || q.includes('deal') || q.includes('budget')) {
      const matchNumber = q.match(/\d+/);
      const budget = matchNumber ? Number(matchNumber[0]) : 60;
      matching = products.filter(p => p.price <= budget);
      responseText = `I found ${matching.length} great items under ${currency}${budget} that match your style preferences:`;
    } else if (q.includes('winter') || q.includes('jacket') || q.includes('warm') || q.includes('cold')) {
      matching = products.filter(p => p.subCategory?.toLowerCase() === 'winterwear' || p.description?.toLowerCase().includes('winter'));
      responseText = "Here are our coziest winterwear choices designed to keep you warm and stylish:";
    } else if (q.includes('women') || q.includes('girl') || q.includes('dress') || q.includes('top')) {
      matching = products.filter(p => p.category?.toLowerCase() === 'women');
      responseText = "Here are top-rated women's fashion picks from our latest collections:";
    } else if (q.includes('men') || q.includes('boy') || q.includes('shirt') || q.includes('t-shirt')) {
      matching = products.filter(p => p.category?.toLowerCase() === 'men');
      responseText = "Here are our trending men's fashion essentials:";
    } else if (q.includes('cotton') || q.includes('fabric') || q.includes('material')) {
      matching = products.filter(p => p.description?.toLowerCase().includes('cotton') || p.name?.toLowerCase().includes('cotton'));
      responseText = "100% pure cotton breathable garments crafted for all-day comfort:";
    } else {
      matching = products.filter(p => p.bestseller || p.price < 100);
      responseText = `Here are some of our most popular pieces tailored to "${query}":`;
    }

    if (matching.length === 0) {
      matching = products.slice(0, 3);
      responseText = "I couldn't find an exact match, but here are our store bestsellers you might love:";
    }

    const aiMsg = {
      id: 'ai_' + Date.now(),
      sender: 'ai',
      text: responseText,
      recommendations: matching.slice(0, 3)
    };

    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-black text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all group'
      >
        <span className='text-lg animate-spin-slow'>✨</span>
        <span className='text-xs font-semibold tracking-wide uppercase'>Ask AI Shopping</span>
        <span className='w-2 h-2 rounded-full bg-green-400 animate-ping'></span>
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className='fixed bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200'>
          {/* Header */}
          <div className='bg-gradient-to-r from-gray-950 via-gray-900 to-indigo-950 text-white p-4 flex items-center justify-between'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-sm'>
                🤖
              </div>
              <div>
                <h3 className='font-semibold text-sm leading-tight'>AI Shopping Assistant</h3>
                <p className='text-[10px] text-green-400 font-medium flex items-center gap-1'>
                  <span className='w-1.5 h-1.5 rounded-full bg-green-400 inline-block'></span>
                  Online • Powered by Gemini AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className='text-gray-400 hover:text-white text-lg w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition'
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className='flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50'>
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-black text-white rounded-br-none shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Embedded Recommendations */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className='w-full mt-2.5 space-y-2'>
                    {msg.recommendations.map(p => (
                      <div key={p._id} className='bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3'>
                        <img src={p.image[0]} alt={p.name} className='w-12 h-12 rounded object-cover bg-gray-50' />
                        <div className='flex-1 min-w-0'>
                          <h5 className='text-xs font-semibold text-gray-900 truncate'>{p.name}</h5>
                          <p className='text-xs font-bold text-gray-800'>{currency}{p.price}</p>
                        </div>
                        <div className='flex flex-col gap-1'>
                          <Link
                            to={`/product/${p._id}`}
                            onClick={() => setIsOpen(false)}
                            className='text-[10px] text-center font-medium bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700'
                          >
                            View
                          </Link>
                          <button
                            onClick={() => addToCart(p._id, p.sizes && p.sizes.length > 0 ? p.sizes[0] : 'M')}
                            className='text-[10px] font-medium bg-black text-white px-2 py-1 rounded hover:bg-gray-800'
                          >
                            +Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className='flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 w-16 text-gray-400'>
                <span className='w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce'></span>
                <span className='w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]'></span>
                <span className='w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]'></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className='p-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto text-[11px]'>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.replace(/^[^\s]+\s/, ''))}
                className='whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition flex-shrink-0'
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className='p-3 bg-white border-t border-gray-200 flex items-center gap-2'
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for fashion advice, sizes, deals..."
              className='flex-1 outline-none text-xs px-3 py-2 bg-gray-100 rounded-full focus:ring-1 focus:ring-black'
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className='bg-black text-white text-xs px-4 py-2 rounded-full hover:bg-gray-800 disabled:opacity-40 transition font-medium'
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiAssistant;
