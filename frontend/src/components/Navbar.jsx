import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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
    // Check initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        fetchUnreadCount(session.user.id);
      }
    };
    getSession();

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        fetchUnreadCount(session.user.id);
      } else {
        setAvatarUrl('');
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAvatar = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (err) {
      console.error("Gagal mengambil avatar:", err);
    }
  };

  const fetchUnreadCount = async (userId) => {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  // Real-time subscription for unread messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('navbar-unread')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        playNotificationSound();
        fetchUnreadCount(user.id);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount(user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    <header className="bg-surface dark:bg-on-background border-b border-outline-variant dark:border-outline shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto h-16">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed-dim hover:opacity-90 transition-opacity group">
          <svg className="w-8 h-8 text-primary dark:text-primary-fixed-dim group-hover:scale-105 transition-transform" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C70 20 45 45 45 75C45 115 100 170 100 170C100 170 155 115 155 75C155 45 130 20 100 20Z" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="100" cy="75" r="25" stroke="currentColor" strokeWidth="10"/>
            <path d="M118 93L135 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
          </svg>
          FindIt Campus
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          <Link to="/" className={getNavClass("/")}>Beranda</Link>
          <Link to="/lost-items" className={getNavClass("/lost-items")}>Barang Hilang</Link>
          <Link to="/found-items" className={getNavClass("/found-items")}>Barang Ditemukan</Link>
          <Link to="/profile" className={getNavClass("/profile")}>Dasbor Laporan</Link>
        </nav>
        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Link to="/create-report" className="hidden md:inline-flex bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95">
            Buat Laporan
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/messages" className="text-on-surface-variant hover:text-primary transition-colors active:scale-95 flex items-center justify-center relative" title="Pesan">
                <span className="material-symbols-outlined text-[24px]">forum</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse shadow-md">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="flex items-center active:scale-95 transition-transform" title="Profil Anda">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-colors bg-surface-container flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant">person</span>
                  )}
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-on-surface-variant hover:text-error transition-colors active:scale-95 ml-2" 
                title="Keluar"
              >
                <span className="material-symbols-outlined text-[24px]">logout</span>
              </button>
            </div>
          ) : (
            <Link to="/auth" className="text-on-surface-variant hover:text-primary transition-colors active:scale-95" title="Masuk / Daftar">
              <span className="material-symbols-outlined text-[28px]" data-icon="account_circle">account_circle</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
