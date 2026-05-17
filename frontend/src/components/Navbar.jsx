import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    // Check initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
      }
    };
    getSession();

    // Listen to changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
      } else {
        setAvatarUrl('');
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
        <Link to="/" className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed-dim hover:opacity-90 transition-opacity">
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
                {/* You can add an unread badge here later */}
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
