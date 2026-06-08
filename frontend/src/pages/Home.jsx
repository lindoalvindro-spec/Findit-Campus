import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { CardSkeleton } from '../components/LoadingSkeleton';
import uinLogo from '../assets/uin.png';
import unriLogo from '../assets/unri.png';
import uirLogo from '../assets/uir.png';
import umriLogo from '../assets/umri.jpg';

const Home = () => {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [previewItems, setPreviewItems] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('lost'); // 'lost' or 'found'
  const navigate = useNavigate();
  
  const campuses = [
    { name: 'UIN Suska Riau', displayName: 'UIN Suska Riau', logo: uinLogo },
    { name: 'Universitas Riau (UNRI)', displayName: 'Universitas Riau (UNRI)', logo: unriLogo },
    { name: 'Universitas Islam Riau (UIR)', displayName: 'Universitas Islam Riau (UIR)', logo: uirLogo },
    { name: 'Universitas Muhammadiyah Riau (UMRI)', displayName: 'Universitas Muhammadiyah Riau (UMRI)', logo: umriLogo },
    { name: 'Lainnya', displayName: 'Kampus Lainnya', logo: null }
  ];

  // Real database stats state
  const [stats, setStats] = useState({
    total: 0,
    returned: 0,
    lost: 0,
    successRate: 0
  });

  // Rotation timer for preview widget
  useEffect(() => {
    if (previewItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPreviewIndex((prevIndex) => (prevIndex + 1) % previewItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [previewItems]);

  useEffect(() => {
    const fetchDataAndStats = async () => {
      setLoading(true);
      
      // 1. Fetch top 3 recent lost items
      const { data: lostData, error: lostError } = await apiClient.get('/api/items?status=lost');

      // 2. Fetch top 3 recent found items
      const { data: foundData, error: foundError } = await apiClient.get('/api/items?status=found');

      if (!lostError && lostData) setLostItems(lostData.slice(0, 3));
      if (!foundError && foundData) setFoundItems(foundData.slice(0, 3));

      // Combine lost and found items for preview widget
      const combined = [];
      const lItems = lostData || [];
      const fItems = foundData || [];
      const maxLen = Math.max(lItems.length, fItems.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < lItems.length) combined.push(lItems[i]);
        if (i < fItems.length) combined.push(fItems[i]);
      }
      setPreviewItems(combined.slice(0, 6));

      // 3. Fetch real database statistics
      try {
        const { data: allItems, error: allItemsError } = await apiClient.get('/api/items');
        
        if (!allItemsError && allItems) {
          const total = allItems.length;
          const lost = allItems.filter(item => item.status === 'lost').length;
          const returned = allItems.filter(item => ['returned', 'claimed'].includes(item.status)).length;
          const successRate = total > 0 ? Math.round((returned / total) * 100) : 0;

          setStats({
            total,
            lost,
            returned,
            successRate
          });
        }
      } catch (err) {
        console.error("Gagal memuat statistik database:", err);
      }

      setLoading(false);
    };

    fetchDataAndStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const targetPath = searchType === 'lost' ? '/lost-items' : '/found-items';
    if (searchQuery.trim()) {
      navigate(`${targetPath}?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(targetPath);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-surface-container-low via-surface-container-low to-surface overflow-hidden py-20 lg:py-28">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Content & Search */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left"
              >
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="font-headline-xl text-headline-xl text-on-surface mb-6 max-w-[672px] leading-tight font-bold"
                >
                  Temukan Barangmu, <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-surface-tint to-[#2563eb]">
                    Bantu Temanmu.
                  </span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="font-body-lg text-body-lg text-on-surface-variant/90 mb-8 max-w-[576px] leading-relaxed font-medium"
                >
                  Platform resmi pencarian barang hilang dan temuan di area kampus. Laporkan barang yang hilang atau serahkan temuan Anda secara aman.
                </motion.p>
                
                {/* Search Type Selector */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="flex gap-2 mb-4 bg-surface-container-low/60 p-1 rounded-full border border-outline-variant/40"
                >
                  <button 
                    type="button" 
                    onClick={() => setSearchType('lost')}
                    className={`px-5 py-2 rounded-full font-label-md text-label-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      searchType === 'lost' 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-high/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    Barang Hilang
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSearchType('found')}
                    className={`px-5 py-2 rounded-full font-label-md text-label-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      searchType === 'found' 
                        ? 'bg-secondary text-on-secondary shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container-high/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Barang Temuan
                  </button>
                </motion.div>

                {/* Search Bar */}
                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  onSubmit={handleSearch} 
                  className={`w-full max-w-[576px] bg-surface/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border flex items-center p-2.5 pl-3 transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] hover:border-outline-variant ${
                    searchType === 'lost'
                      ? 'border-outline-variant/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed'
                      : 'border-outline-variant/80 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary-fixed'
                  }`}
                >
                  <span className={`material-symbols-outlined ml-3 select-none transition-colors duration-200 ${
                    searchType === 'lost' ? 'text-primary' : 'text-secondary'
                  }`}>
                    search
                  </span>
                  <input 
                    className="flex-grow bg-transparent border-none focus:ring-0 font-body-md text-body-md px-3 text-on-surface placeholder:text-outline focus:outline-none" 
                    placeholder={searchType === 'lost' ? "Cari barang hilang..." : "Cari barang temuan..."} 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <motion.button 
                    type="submit" 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-8 py-2.5 rounded-full font-label-md text-label-md transition-all shadow-sm hover:shadow-md cursor-pointer ${
                      searchType === 'lost'
                        ? 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
                        : 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container'
                    }`}
                  >
                    Cari
                  </motion.button>
                </motion.form>

                {/* Popular Search Tags */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap gap-2 mt-5 items-center justify-center lg:justify-start"
                >
                  <span className="font-label-sm text-label-sm text-outline">Pencarian populer:</span>
                  {['Kunci', 'KTM', 'Dompet', 'Charger', 'Almamater'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        const targetPath = searchType === 'lost' ? '/lost-items' : '/found-items';
                        navigate(`${targetPath}?q=${encodeURIComponent(tag)}`);
                      }}
                      className={`px-3 py-1 rounded-full border border-outline-variant/60 bg-surface/40 transition-all text-xs font-medium text-on-surface-variant cursor-pointer ${
                        searchType === 'lost' 
                          ? 'hover:border-primary hover:text-primary' 
                          : 'hover:border-secondary hover:text-secondary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right Column: Premium Interactive Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:col-span-5 flex items-center justify-center relative min-h-[360px]"
              >
                {loading ? (
                  /* Skeleton Card Mockup during Loading */
                  <div className="relative w-full max-w-[340px]">
                    <div className="block bg-surface/80 dark:bg-surface-container-low/95 border border-outline-variant/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl p-5 backdrop-blur-md relative z-10 w-full">
                      <div className="flex items-center justify-between mb-4 border-b border-outline-variant/30 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-outline-variant/35 animate-pulse"></span>
                          <span className="w-3 h-3 rounded-full bg-outline-variant/35 animate-pulse"></span>
                          <span className="w-3 h-3 rounded-full bg-outline-variant/35 animate-pulse"></span>
                        </div>
                        <span className="text-[11px] font-bold tracking-widest text-outline/45 uppercase animate-pulse">FindIt Preview</span>
                      </div>

                      <div className="rounded-2xl overflow-hidden h-40 bg-surface-container-high/40 relative mb-4 animate-pulse flex items-center justify-center">
                        <span className="material-symbols-outlined text-[54px] text-outline/25">badge</span>
                      </div>

                      <div className="h-5 bg-outline-variant/30 rounded-lg w-2/3 mb-3 animate-pulse"></div>
                      <div className="h-4 bg-outline-variant/20 rounded-lg w-1/2 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-outline-variant/20 rounded-lg w-1/3 mb-4 animate-pulse"></div>
                      <div className="w-full h-2 bg-outline-variant/20 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  /* Floating Mockup Stack */
                  <motion.div 
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-full max-w-[340px]"
                  >
                    <AnimatePresence mode="wait">
                      {previewItems.length > 0 && previewItems[currentPreviewIndex] ? (
                        (() => {
                          const activeItem = previewItems[currentPreviewIndex];
                          return (
                            <motion.div
                              key={activeItem.id}
                              initial={{ opacity: 0, scale: 0.94, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.94, y: -10 }}
                              transition={{ duration: 0.35, ease: "easeInOut" }}
                              className="relative w-full"
                            >
                              {/* Base App Card Mockup */}
                              <Link 
                                to={`/item-detail?id=${activeItem.id}`} 
                                className="block bg-surface/80 dark:bg-surface-container-low/95 border border-outline-variant/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl p-5 backdrop-blur-md relative z-10 hover:border-primary/50 transition-all group/card cursor-pointer"
                              >
                                <div className="flex items-center justify-between mb-4 border-b border-outline-variant/30 pb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-error" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-success" />
                                  </div>
                                  <span className="text-[11px] font-bold tracking-widest text-outline uppercase">FindIt Preview</span>
                                </div>

                                <div className="rounded-2xl overflow-hidden h-40 bg-surface-container relative mb-4 flex items-center justify-center border border-outline-variant/10">
                                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full font-label-sm text-[11px] font-semibold z-10 shadow-sm ${
                                    activeItem.status === 'lost' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                                  }`}>
                                    {activeItem.status === 'lost' ? 'Hilang' : 'Ditemukan'}
                                  </div>
                                  {activeItem.image_url ? (
                                    <img src={activeItem.image_url} alt={activeItem.title} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-surface-container-high">
                                      <span className="material-symbols-outlined text-[54px] text-primary/30">
                                        {activeItem.category === 'Kartu/Dokumen' || activeItem.title.toLowerCase().includes('ktm') ? 'badge' : 'inventory_2'}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1 truncate group-hover/card:text-primary transition-colors text-left">
                                  {activeItem.title}
                                </h4>
                                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-1 truncate text-left">
                                  <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                                  {activeItem.location || 'Area Kampus'}
                                </p>
                                <p className="font-body-sm text-body-sm text-outline flex items-center gap-1 mb-3 truncate text-left">
                                  <span className="material-symbols-outlined text-sm">school</span>
                                  {activeItem.campus || 'UIN Suska Riau'}
                                </p>
                                
                                {/* 3-second cycle progress bar */}
                                <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden relative">
                                  <motion.div 
                                    key={activeItem.id}
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3, ease: "linear" }}
                                    className={`h-full ${activeItem.status === 'lost' ? 'bg-primary' : 'bg-secondary'}`}
                                  />
                                </div>
                              </Link>

                              {/* Overlapping Chat Bubble Mockup */}
                              <motion.div 
                                animate={{ y: [0, 6, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="absolute -bottom-6 -left-8 bg-primary text-on-primary rounded-2xl rounded-bl-none p-3.5 shadow-[0_10px_25px_rgba(0,40,142,0.15)] text-[12px] max-w-[210px] z-20 border border-primary-container text-left"
                              >
                                <div className="font-bold text-[10px] opacity-75 mb-1 text-white/95">
                                  {activeItem.users?.full_name || 'Pengguna'} ({activeItem.status === 'lost' ? 'Owner' : 'Finder'})
                                </div>
                                {activeItem.status === 'lost' 
                                  ? `"${activeItem.users?.full_name || 'Saya'} membuat laporan kehilangan barang ini, mohon hubungi jika ada info..."`
                                  : `"${activeItem.users?.full_name || 'Saya'} melaporkan penemuan barang ini, silakan hubungi untuk serah terima..."`}
                              </motion.div>

                              {/* Overlapping AI Match Badge Mockup */}
                              <motion.div 
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className={`absolute -top-8 -right-6 rounded-2xl p-3 shadow-[0_10px_25px_rgba(0,0,0,0.08)] text-xs font-semibold z-20 border flex items-center gap-2 ${
                                  activeItem.status === 'lost' 
                                    ? 'bg-error-container text-on-error-container border-error/20' 
                                    : 'bg-secondary-container text-on-secondary-container border-secondary/20'
                                }`}
                              >
                                <span className={`material-symbols-outlined text-lg ${
                                  activeItem.status === 'lost' ? 'text-error' : 'text-secondary'
                                }`}>
                                  {activeItem.status === 'lost' ? 'new_releases' : 'verified'}
                                </span>
                                {activeItem.status === 'lost' ? 'Laporan Hilang Terbaru' : 'Laporan Temuan Terbaru'}
                              </motion.div>
                            </motion.div>
                          );
                        })()
                      ) : (
                        // Default mockup in case database is empty
                        <div className="block bg-surface/80 dark:bg-surface-container-low/95 border border-outline-variant/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl p-5 backdrop-blur-md relative z-10 w-[340px]">
                          <div className="flex items-center justify-between mb-4 border-b border-outline-variant/30 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-error"></span>
                              <span className="w-3 h-3 rounded-full bg-warning"></span>
                              <span className="w-3 h-3 rounded-full bg-success"></span>
                            </div>
                            <span className="text-[11px] font-bold tracking-widest text-outline uppercase">FindIt Preview</span>
                          </div>
                          <div className="rounded-2xl overflow-hidden h-40 bg-surface-container relative mb-4 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[54px] text-primary/30">inventory_2</span>
                          </div>
                          <h4 className="font-label-md text-label-md text-on-surface font-semibold mb-1">
                            Belum Ada Laporan
                          </h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                            -
                          </p>
                          <div className="w-full h-2 bg-outline-variant/30 rounded-full overflow-hidden" />
                        </div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>

            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Animated Blobs */}
            <motion.div 
              animate={{ 
                x: [0, 30, -30, 0],
                y: [0, -30, 30, 0],
                scale: [1, 1.1, 0.9, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[5%] left-[5%] w-80 md:w-[450px] h-80 md:h-[450px] bg-primary/25 rounded-full filter blur-3xl"
            ></motion.div>
            <motion.div 
              animate={{ 
                x: [0, -40, 40, 0],
                y: [0, 40, -40, 0],
                scale: [1, 0.9, 1.1, 1]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-[5%] right-[5%] w-80 md:w-[450px] h-80 md:h-[450px] bg-[#3b82f6]/25 rounded-full filter blur-3xl"
            ></motion.div>
            <motion.div 
              animate={{ 
                x: [0, 50, -50, 0],
                y: [0, -50, 50, 0],
                scale: [1, 1.05, 0.95, 1]
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 4 }}
              className="absolute -bottom-16 left-[25%] w-80 md:w-[450px] h-80 md:h-[450px] bg-tertiary-fixed/20 rounded-full filter blur-3xl"
            ></motion.div>
            
            {/* Floating Icons */}
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[20%] left-[5%] opacity-25"
            >
              <span className="material-symbols-outlined text-6xl text-primary">backpack</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-[60%] right-[8%] opacity-25"
            >
              <span className="material-symbols-outlined text-5xl text-[#3b82f6]">phone_android</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-[15%] left-[15%] opacity-25"
            >
              <span className="material-symbols-outlined text-7xl text-tertiary">key</span>
            </motion.div>
            
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBWMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yMCAwTDIwIDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMScvPjxwYXRoIGQ9Ik0wIDIwaDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMScvPjwvc3ZnPg==')] opacity-50"></div>
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="py-16 bg-surface relative z-10 border-t border-outline-variant/30">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {}
              }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Stat 1 */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-surface-container-low rounded-2xl p-6 text-center border border-outline-variant/60 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-2xl">analytics</span>
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="font-headline-lg text-headline-lg text-primary font-bold group-hover:scale-105 transition-all"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    <span>{stats.total.toLocaleString('id-ID')}</span>
                  )}
                </motion.div>
                <div className="font-label-md text-label-md text-on-surface-variant font-medium">Total Laporan</div>
              </motion.div>

              {/* Stat 2 */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-surface-container-low rounded-2xl p-6 text-center border border-outline-variant/60 shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: 0.3 }}
                  className="font-headline-lg text-headline-lg text-secondary font-bold group-hover:scale-105 transition-all"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    <span>{stats.returned.toLocaleString('id-ID')}</span>
                  )}
                </motion.div>
                <div className="font-label-md text-label-md text-on-surface-variant font-medium">Barang Kembali</div>
              </motion.div>

              {/* Stat 3 */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-surface-container-low rounded-2xl p-6 text-center border border-outline-variant/60 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: 0.4 }}
                  className="font-headline-lg text-headline-lg text-primary font-bold group-hover:scale-105 transition-all"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    <span>{stats.lost.toLocaleString('id-ID')}</span>
                  )}
                </motion.div>
                <div className="font-label-md text-label-md text-on-surface-variant font-medium">Sedang Dicari</div>
              </motion.div>

              {/* Stat 4 */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-surface-container-low rounded-2xl p-6 text-center border border-outline-variant/60 shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", delay: 0.5 }}
                  className="font-headline-lg text-headline-lg text-secondary font-bold group-hover:scale-105 transition-all"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">...</span>
                  ) : (
                    <span>{`${stats.successRate}%`}</span>
                  )}
                </motion.div>
                <div className="font-label-md text-label-md text-on-surface-variant font-medium">Tingkat Sukses</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Search by Campus */}
        <section className="py-16 bg-surface-container-low border-t border-b border-outline-variant/30">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <div className="mb-12 text-center">
              <span className="font-label-md text-label-md text-primary tracking-widest uppercase mb-2">Jelajahi Kampus</span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Cari Berdasarkan Kampus</h2>
              <div className="w-12 h-1 bg-primary rounded-full mx-auto mt-4"></div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {campuses.map((campus) => (
                <motion.div
                  key={campus.name}
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => navigate(`/lost-items?campus=${encodeURIComponent(campus.name)}`)}
                  className="bg-surface rounded-2xl border border-outline-variant/60 p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group"
                >
                  <div className="w-24 h-24 flex items-center justify-center mb-4 p-2 rounded-2xl bg-surface-container-high/50 group-hover:bg-primary/5 transition-all">
                    {campus.logo ? (
                      <img src={campus.logo} alt={campus.name} className="max-w-full max-h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-all duration-300" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                        <span className="material-symbols-outlined text-4xl">school</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-label-md text-label-md text-on-surface font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {campus.displayName}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 bg-surface-container-lowest">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <div className="mb-16 max-w-[672px] mx-auto flex flex-col items-center text-center">
              <span className="font-label-md text-label-md text-primary tracking-widest uppercase mb-2">Alur Sistem</span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-headline-lg text-headline-lg text-on-surface font-bold"
              >
                Cara Kerja FindIt Campus
              </motion.h2>
              <div className="w-12 h-1 bg-primary rounded-full mt-4"></div>
            </div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{ visible: { transition: { staggerChildren: 0.2 } }, hidden: {} }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
            >
              {/* Card 1 */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} 
                whileHover={{ y: -10 }}
                className="relative flex flex-col items-start text-left p-8 rounded-3xl border border-outline-variant/60 bg-surface-container-low hover:border-primary/30 hover:bg-primary/5 hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="text-headline-lg font-bold text-outline/25 dark:text-outline-variant/15 group-hover:text-primary group-hover:drop-shadow-[0_0_12px_rgba(0,40,142,0.8)] group-hover:scale-110 select-none absolute top-6 right-8 transition-all duration-300">
                  01
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 shadow-sm"
                >
                  <motion.span 
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="material-symbols-outlined text-2xl"
                  >
                    edit_document
                  </motion.span>
                </motion.div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 group-hover:text-primary transition-colors duration-300 font-semibold">Lapor & Publikasikan</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Unggah detail barang hilang atau temuan lengkap dengan foto dan lokasi spesifik di kampus secara cepat.
                </p>
              </motion.div>
              
              {/* Card 2 */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} 
                whileHover={{ y: -10 }}
                className="relative flex flex-col items-start text-left p-8 rounded-3xl border border-outline-variant/60 bg-surface-container-low hover:border-secondary/30 hover:bg-secondary/5 hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="text-headline-lg font-bold text-outline/25 dark:text-outline-variant/15 group-hover:text-secondary group-hover:drop-shadow-[0_0_12px_rgba(0,108,74,0.8)] group-hover:scale-110 select-none absolute top-6 right-8 transition-all duration-300">
                  02
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300 shadow-sm"
                >
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="material-symbols-outlined text-2xl"
                  >
                    fact_check
                  </motion.span>
                </motion.div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 group-hover:text-secondary transition-colors duration-300 font-semibold">Pencocokan & Moderasi</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Sistem otomatis mencocokkan data barang serta memoderasi konten gambar (AI NSFW) dan kata-kata kasar untuk keamanan.
                </p>
              </motion.div>
              
              {/* Card 3 */}
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} 
                whileHover={{ y: -10 }}
                className="relative flex flex-col items-start text-left p-8 rounded-3xl border border-outline-variant/60 bg-surface-container-low hover:border-primary/30 hover:bg-primary/5 hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="text-headline-lg font-bold text-outline/25 dark:text-outline-variant/15 group-hover:text-primary group-hover:drop-shadow-[0_0_12px_rgba(0,40,142,0.8)] group-hover:scale-110 select-none absolute top-6 right-8 transition-all duration-300">
                  03
                </div>
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 shadow-sm"
                >
                  <motion.span 
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className="material-symbols-outlined text-2xl"
                  >
                    handshake
                  </motion.span>
                </motion.div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 group-hover:text-primary transition-colors duration-300 font-semibold">Hubungi & Kembalikan</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Komunikasi langsung secara aman dengan fitur chat realtime dan lakukan serah terima barang di area kampus.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Recent Lost Items */}
        <section className="py-20 bg-surface">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <div className="bg-surface-container-low/60 border border-outline-variant/50 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
              {/* Subtle background blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>

              <div className="flex justify-between items-end mb-10 relative z-10">
                <div>
                  <span className="font-label-md text-label-md text-primary tracking-widest uppercase mb-1 block">Mari Membantu</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Barang Hilang Terbaru</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">Bantu teman menemukan barang mereka di lingkungan kampus.</p>
                </div>
                <Link className="text-primary font-label-md text-label-md hover:underline flex items-center gap-1 font-semibold" to="/lost-items">
                  Lihat Semua <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.15 } }, hidden: {} }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
              >
                {loading ? (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                ) : lostItems.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full py-16 text-center text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/60 shadow-sm"
                  >
                    <motion.span 
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      className="material-symbols-outlined text-4xl mb-3 opacity-50 inline-block text-primary"
                    >
                      search_off
                    </motion.span>
                    <p className="font-medium text-on-surface-variant">Belum ada laporan barang hilang terbaru.</p>
                  </motion.div>
                ) : (
                  lostItems.map((item) => (
                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                      key={item.id}
                      whileHover={{ y: -8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Link to={`/item-detail?id=${item.id}`} className="block bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full group">
                        <div className="h-48 bg-surface-container flex items-center justify-center relative overflow-hidden">
                          {item.image_url ? (
                            <motion.img 
                              src={item.image_url} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.08 }}
                              transition={{ duration: 0.4 }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                              <span className="material-symbols-outlined text-[64px] text-outline/30 select-none">
                                inventory_2
                              </span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-[11px] font-semibold z-10 shadow-sm">
                            Hilang
                          </div>
                          {item.campus && (
                            <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-sm text-on-surface px-2.5 py-1 rounded-lg font-label-sm text-[11px] font-medium z-10 border border-outline-variant/40 shadow-sm">
                              {item.campus}
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 truncate group-hover:text-primary transition-colors font-semibold">{item.title}</h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-outline">location_on</span> 
                            <span className="truncate">{item.location || 'Tidak diketahui'}</span>
                          </p>
                          <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/50">
                            <span className="font-label-sm text-label-sm text-outline">{item.date_lost ? new Date(item.date_lost).toLocaleDateString('id-ID') : '-'}</span>
                            <span className="text-primary font-label-md text-label-md bg-primary/5 group-hover:bg-primary group-hover:text-on-primary px-4 py-1.5 rounded-full transition-all duration-300 font-semibold">
                              Detail
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Recent Found Items */}
        <section className="py-20 bg-surface-container-lowest border-t border-outline-variant/30">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <div className="bg-surface-container-low/60 border border-outline-variant/50 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
              {/* Subtle background blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full filter blur-3xl pointer-events-none"></div>

              <div className="flex justify-between items-end mb-10 relative z-10">
                <div>
                  <span className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-1 block">Barang Temuan</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Barang Temuan Terbaru</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">Cek daftar berikut jika Anda merasa kehilangan barang berharga Anda.</p>
                </div>
                <Link className="text-secondary font-label-md text-label-md hover:underline flex items-center gap-1 font-semibold" to="/found-items">
                  Lihat Semua <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.15 } }, hidden: {} }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
              >
                {loading ? (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                ) : foundItems.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full py-16 text-center text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/60 shadow-sm"
                  >
                    <motion.span 
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      className="material-symbols-outlined text-4xl mb-3 opacity-50 inline-block text-secondary"
                    >
                      search_off
                    </motion.span>
                    <p className="font-medium text-on-surface-variant">Belum ada laporan barang temuan terbaru.</p>
                  </motion.div>
                ) : (
                  foundItems.map((item) => (
                    <motion.div 
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                      key={item.id}
                      whileHover={{ y: -8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Link to={`/item-detail?id=${item.id}`} className="block bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-secondary/20 transition-all duration-300 flex flex-col h-full group">
                        <div className="h-48 bg-surface-container flex items-center justify-center relative overflow-hidden">
                          {item.image_url ? (
                            <motion.img 
                              src={item.image_url} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.08 }}
                              transition={{ duration: 0.4 }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                              <span className="material-symbols-outlined text-[64px] text-outline/30 select-none">
                                inventory_2
                              </span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-[11px] font-semibold z-10 shadow-sm">
                            Ditemukan
                          </div>
                          {item.campus && (
                            <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-sm text-on-surface px-2.5 py-1 rounded-lg font-label-sm text-[11px] font-medium z-10 border border-outline-variant/40 shadow-sm">
                              {item.campus}
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 truncate group-hover:text-secondary transition-colors font-semibold">{item.title}</h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-outline">location_on</span> 
                            <span className="truncate">{item.location || 'Tidak diketahui'}</span>
                          </p>
                          <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant/50">
                            <span className="font-label-sm text-label-sm text-outline">{item.date_lost ? new Date(item.date_lost).toLocaleDateString('id-ID') : '-'}</span>
                            <span className="text-secondary font-label-md text-label-md bg-secondary/5 group-hover:bg-secondary group-hover:text-on-secondary px-4 py-1.5 rounded-full transition-all duration-300 font-semibold">
                              Detail
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call To Action (CTA) Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-[#1e40af] text-on-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 z-0"></div>
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto text-center relative z-10">
            <h2 className="font-headline-lg text-headline-lg font-bold mb-4">Mulai Membantu Sesama Mahasiswa</h2>
            <p className="font-body-lg text-body-lg text-primary-fixed mb-8 max-w-[672px] mx-auto opacity-90">
              Apakah Anda kehilangan barang berharga? Atau menemukan barang milik mahasiswa lain? Laporkan sekarang untuk mengembalikannya ke pemilik sah.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/create-report?type=lost" className="px-8 py-3.5 bg-surface text-primary font-label-md text-label-md rounded-full hover:bg-surface-container-high transition-all shadow-md font-semibold text-center">
                Laporkan Kehilangan
              </Link>
              <Link to="/create-report?type=found" className="px-8 py-3.5 bg-transparent border-2 border-surface text-on-primary font-label-md text-label-md rounded-full hover:bg-surface/10 transition-all font-semibold text-center">
                Laporkan Temuan
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
