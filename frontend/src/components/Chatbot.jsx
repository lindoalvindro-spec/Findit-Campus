import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- KNOWLEDGE BASE CHATBOT (CLIENT-SIDE) ---
const botKnowledge = [
  {
    keywords: ['lapor', 'hilang', 'buat laporan', 'cara melapor'],
    response: 'Untuk melapor barang hilang atau ditemukan, klik tombol **Buat Laporan** di menu atas atau sidebar. Isi form dengan judul, deskripsi, lokasi, dan unggah foto barang agar mudah dikenali ya! 📝'
  },
  {
    keywords: ['password', 'lupa sandi', 'ganti password'],
    response: 'Jika Anda lupa password, Anda bisa melakukan reset melalui halaman login dengan menekan tombol **"Lupa Password?"**. Nanti instruksinya akan dikirimkan ke email Anda. 🔐'
  },
  {
    keywords: ['hubungi', 'chat', 'pesan', 'penemu', 'pemilik'],
    response: 'Anda bisa menghubungi pemilik atau penemu barang langsung dari aplikasi lho! Buka halaman detail barang tersebut, lalu tekan tombol **Kirim Pesan**. Percakapan akan masuk ke menu Messages. 💬'
  },
  {
    keywords: ['status', 'tracker', 'lacak', 'sudah ketemu'],
    response: 'Setiap laporan memiliki Live Tracker! Anda dapat melihat status barang (Draft ➡️ Dilaporkan ➡️ Verifikasi ➡️ Selesai). Pembuat laporan dapat mengubah status tersebut di halaman detail barang miliknya. 📍'
  },
  {
    keywords: ['admin', 'cs', 'bantuan lanjut', 'error', 'bug'],
    response: 'Sepertinya Anda butuh bantuan lebih lanjut. Silakan hubungi Admin FindIt Campus via WhatsApp: **+62 878-6627-2028** (tersedia 24/7). 📞'
  },
  {
    keywords: ['halo', 'hai', 'hello', 'hi', 'pagi', 'siang', 'sore', 'malam'],
    response: 'Halo! 👋 Saya FindIt Assistant. Ada yang bisa saya bantu terkait aplikasi FindIt Campus hari ini?'
  },
  {
    keywords: ['terima kasih', 'makasih', 'thank you', 'thanks'],
    response: 'Sama-sama! Senang bisa membantu. Jangan ragu bertanya lagi jika butuh bantuan. Selamat beraktivitas! ✨'
  }
];

const getBotResponse = (message) => {
  const lowerMsg = message.toLowerCase();
  for (let item of botKnowledge) {
    if (item.keywords.some(kw => lowerMsg.includes(kw))) {
      return item.response;
    }
  }
  // Fallback response
  return 'Maaf, saya belum memahami pertanyaan tersebut. 😅 Anda bisa menanyakan hal seputar cara melapor barang, melacak status, atau silakan hubungi Admin di WhatsApp (+62 878-6627-2028).';
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Halo! 👋 Saya FindIt Assistant. Ada yang bisa saya bantu seputar FindIt Campus hari ini?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Custom Event Listener to open chatbot from other components
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-chatbot', handleOpenChatbot);
  }, []);

  // Auto scroll
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (text = inputValue) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate network delay / typing
    setTimeout(() => {
      const botResponse = getBotResponse(text);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2s delay
  };

  const faqChips = [
    'Bagaimana cara lapor?',
    'Cara hubungi penemu?',
    'Di mana letak tracker?'
  ];

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-xl shadow-primary/30 flex items-center justify-center z-50 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-[28px] animate-pulse-slow">support_agent</span>
            
            {/* Notification Dot */}
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error border-2 border-primary"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 right-6 w-full max-w-[360px] h-[550px] max-h-[85vh] bg-surface/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden sm:right-6 right-4 sm:w-[360px] w-[calc(100vw-32px)]"
          >
            {/* Header */}
            <div className="bg-primary/95 text-on-primary p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                    <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-label-lg font-semibold leading-tight">FindIt Assistant</h3>
                  <p className="text-[11px] opacity-80 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online 24/7
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-surface-container-lowest/50">
              
              {/* Timestamp */}
              <div className="flex justify-center">
                <span className="text-[10px] font-medium text-on-surface-variant/60 bg-surface-variant/30 px-2 py-0.5 rounded-full">
                  Hari ini
                </span>
              </div>

              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-[13.5px] leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-on-primary rounded-tr-sm' 
                      : 'bg-surface-container-high text-on-surface rounded-tl-sm border border-outline-variant/30'
                  }`}>
                    {/* Parse bold texts safely */}
                    {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-surface-container-high text-on-surface rounded-2xl rounded-tl-sm border border-outline-variant/30 p-3.5 px-4 shadow-sm flex items-center gap-1">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full" />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-surface border-t border-outline-variant/30 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
              {/* FAQ Chips */}
              {messages.length === 1 && !isTyping && (
                <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar snap-x">
                  {faqChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip)}
                      className="snap-start flex-shrink-0 bg-secondary-container/50 hover:bg-secondary-container text-on-secondary-container text-[11px] font-medium px-3 py-1.5 rounded-full border border-secondary/20 transition-colors whitespace-nowrap"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-end gap-2 relative"
              >
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Tanya asisten FindIt..."
                  className="flex-1 bg-surface-container rounded-2xl px-4 py-3 text-[13.5px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-on-surface-variant/50 border border-transparent focus:border-primary/20"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="w-11 h-11 bg-primary text-on-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm flex-shrink-0 mb-0.5"
                >
                  <span className="material-symbols-outlined text-[18px] translate-x-0.5">send</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
