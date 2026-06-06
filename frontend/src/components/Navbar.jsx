import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/apiClient';
import { io } from 'socket.io-client';

const Navbar = () => {
  const { pathname: path } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prevUnreadRef = useRef(0);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/auth');
    } catch (error) {
      console.error("Gagal logout:", error.message);
    }
  };

  // Notification sound using Web Audio API
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // First tone (higher pitch)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.value = 830;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.3);

      // Second tone (even higher, slight delay)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1200;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc2.start(audioCtx.currentTime + 0.15);
      osc2.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio not supported or blocked by browser
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const token = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      if (token && localUser) {
        try {
          const parsedUser = JSON.parse(localUser);
          setUser(parsedUser);
          fetchAvatar(parsedUser.id);
          fetchUnreadCount();
        } catch (err) {
          console.error("Error parsing user from localStorage:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    
    getSession();

    const handleStorageChange = () => {
      getSession();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchAvatar = async (userId) => {
    try {
      const { data, error } = await apiClient.get(`/api/auth/user/${userId}`);
      if (!error && data) {
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (err) {
      console.error("Gagal mengambil avatar:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data, error } = await apiClient.get('/api/messages/unread-count');
      if (!error && data) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error("Gagal mengambil jumlah pesan belum dibaca:", err);
    }
  };

  // Real-time subscription for unread messages using Socket.io
  useEffect(() => {
    if (!user) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(API_BASE_URL);

    socket.emit('join_user_room', user.id);

    socket.on('receive_message', (msg) => {
      playNotificationSound();
      fetchUnreadCount();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const getNavClass = (targetPath) => {
    const isActive = path === targetPath;
    if (isActive) {
      return "text-primary dark:text-primary-fixed-dim font-bold border-b-2 border-primary dark:border-primary-fixed-dim pb-1 font-label-md text-label-md hover:text-primary dark:hover:text-primary-fixed transition-all duration-150 active:scale-95";
    }
    return "text-on-surface-variant dark:text-outline-variant font-medium font-label-md text-label-md hover:text-primary dark:hover:text-primary-fixed transition-all duration-150 active:scale-95";
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-surface dark:bg-on-background border-b border-outline-variant dark:border-outline shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-surface/95"
    >
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto h-16">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed-dim hover:opacity-90 transition-opacity group">
          <motion.svg 
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-8 h-8 text-primary dark:text-primary-fixed-dim" 
            viewBox="0 0 200 200" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M100 20C70 20 45 45 45 75C45 115 100 170 100 170C100 170 155 115 155 75C155 45 130 20 100 20Z" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="100" cy="75" r="25" stroke="currentColor" strokeWidth="10"/>
            <path d="M118 93L135 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
          </motion.svg>
          FindIt Campus
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link to="/" className={getNavClass("/")}>Beranda</Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link to="/lost-items" className={getNavClass("/lost-items")}>Barang Hilang</Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link to="/found-items" className={getNavClass("/found-items")}>Barang Ditemukan</Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link to="/profile" className={getNavClass("/profile")}>Dasbor Laporan</Link>
          </motion.div>
        </nav>
        {/* Actions */}
        <div className="flex items-center space-x-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/create-report" className="hidden md:inline-flex bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors">
              Buat Laporan
            </Link>
          </motion.div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link to="/messages" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center relative" title="Pesan">
                  <span className="material-symbols-outlined text-[24px]">forum</span>
                  {unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse shadow-md"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link to="/profile" className="flex items-center transition-transform" title="Profil Anda">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-colors bg-surface-container flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-on-surface-variant">person</span>
                    )}
                  </div>
                </Link>
              </motion.div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 10 }} 
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="text-on-surface-variant hover:text-error transition-colors ml-2" 
                title="Keluar"
              >
                <span className="material-symbols-outlined text-[24px]">logout</span>
              </motion.button>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link to="/auth" className="text-on-surface-variant hover:text-primary transition-colors" title="Masuk / Daftar">
                <span className="material-symbols-outlined text-[28px]" data-icon="account_circle">account_circle</span>
              </Link>
            </motion.div>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-on-surface-variant hover:text-primary p-2 focus:outline-none transition-colors"
            title="Menu"
          >
            <span className="material-symbols-outlined text-[28px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden bg-surface dark:bg-on-background border-t border-outline-variant dark:border-outline px-margin-mobile py-4 flex flex-col gap-3 shadow-md overflow-hidden"
          >
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="font-label-md text-label-md text-on-surface dark:text-outline-variant hover:text-primary py-2 border-b border-outline-variant/30 transition-colors">Beranda</Link>
            <Link to="/lost-items" onClick={() => setIsMobileMenuOpen(false)} className="font-label-md text-label-md text-on-surface dark:text-outline-variant hover:text-primary py-2 border-b border-outline-variant/30 transition-colors">Barang Hilang</Link>
            <Link to="/found-items" onClick={() => setIsMobileMenuOpen(false)} className="font-label-md text-label-md text-on-surface dark:text-outline-variant hover:text-primary py-2 border-b border-outline-variant/30 transition-colors">Barang Ditemukan</Link>
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="font-label-md text-label-md text-on-surface dark:text-outline-variant hover:text-primary py-2 border-b border-outline-variant/30 transition-colors">Dasbor Laporan</Link>
            <Link to="/create-report" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary text-on-primary text-center py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors mt-2">
              Buat Laporan
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
