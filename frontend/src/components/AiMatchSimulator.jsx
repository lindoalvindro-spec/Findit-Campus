import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0
  })
};

// Fallback mockup data in case database is empty
const fallbackLostItems = [
  { id: 'mock-lost-1', title: 'KTM UIN Suska Riau', users: { full_name: 'Reza Amanda' }, location: 'Perpustakaan Lt. 2', category: 'Kartu/Dokumen', description: 'KTM atas nama Reza Amanda, NIM 12250111xxx, Fakultas Tarbiyah.', status: 'lost' },
  { id: 'mock-lost-2', title: 'Kunci Vario Hitam', users: { full_name: 'Dian Saputra' }, location: 'Parkiran Tarbiyah', category: 'Lainnya', description: 'Kunci motor Honda dengan gantungan kulit coklat bertuliskan Eiger.', status: 'lost' },
  { id: 'mock-lost-3', title: 'Dompet Eiger Coklat', users: { full_name: 'Rian Hidayat' }, location: 'Masjid Al-Jamiah', category: 'Lainnya', description: 'Dompet kulit coklat merk Eiger berisi KTP, KTM, dan uang tunai.', status: 'lost' }
];
const fallbackFoundItems = [
  { id: 'mock-found-1', title: 'Kartu Tanda Mahasiswa UIN', users: { full_name: 'Fajar Pratama' }, location: 'Meja Belajar Perpustakaan', category: 'Kartu/Dokumen', description: 'Ditemukan KTM UIN Suska di perpus lt 2 atas nama Reza A.', status: 'found' },
  { id: 'mock-found-2', title: 'Kunci Motor Honda & Gantungan', users: { full_name: 'Siti Rahma' }, location: 'Parkiran Tarbiyah Dekat Pohon', category: 'Lainnya', description: 'Ditemukan kunci motor Honda dengan dompet gantungan kulit coklat.', status: 'found' },
  { id: 'mock-found-3', title: 'Dompet Kulit Pria Cokelat', users: { full_name: 'Ahmad Fauzi' }, location: 'Tempat Wudhu Masjid', category: 'Lainnya', description: 'Menemukan dompet kulit warna coklat di area tempat wudhu masjid kampus.', status: 'found' }
];

const getIcon = (item) => {
  if (!item) return 'inventory_2';
  if (item.icon) return item.icon;
  const t = (item.title || '').toLowerCase();
  const c = (item.category || '').toLowerCase();
  if (c.includes('kartu') || t.includes('ktm') || t.includes('kartu') || t.includes('ktp')) return 'badge';
  if (t.includes('kunci') || t.includes('key')) return 'key';
  if (t.includes('dompet') || t.includes('wallet')) return 'account_balance_wallet';
  if (t.includes('hp') || t.includes('phone') || t.includes('handphone')) return 'phone_android';
  if (t.includes('tas') || t.includes('bag') || t.includes('ransel')) return 'backpack';
  if (t.includes('charger') || t.includes('laptop') || t.includes('macbook')) return 'laptop_mac';
  if (t.includes('almamater') || t.includes('jas') || t.includes('jaket')) return 'checkroom';
  return 'inventory_2';
};

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'Semua': return 'grid_view';
    case 'Dokumen & Kartu': return 'badge';
    case 'Elektronik & Gadget': return 'phone_android';
    case 'Kunci': return 'key';
    case 'Aksesoris & Perhiasan': return 'stars';
    default: return 'more_horiz';
  }
};

const getKeywords = (text = '') => {
  const stop = ['barang','yang','dengan','untuk','pada','dan','atau','saya','oleh','dari','bisa','ada','di','ini','itu','ke','seorang','telah','sudah','baru','akan','jika','atas','nama','lainnya'];
  return text.toLowerCase().split(/[\s,./?()\"]+/).filter(w => w.length > 2 && !stop.includes(w));
};

const calculateMatch = (lost, foundList) => {
  if (!lost || foundList.length === 0) return null;
  let bestMatch = null, highestScore = 0, bestReasons = [];
  const lostTitleKw = getKeywords(lost.title);
  const lostDescKw = getKeywords(lost.description);
  const lostLocKw = getKeywords(lost.location);

  foundList.forEach(found => {
    let score = 10;
    const reasons = [];
    if (lost.category && found.category && lost.category === found.category && lost.category !== 'Lainnya') {
      score += 35; reasons.push({ icon: 'category', text: `Kategori identik: "${lost.category}"` });
    }
    const fLocKw = getKeywords(found.location);
    const mLocs = lostLocKw.filter(k => fLocKw.includes(k));
    if (mLocs.length > 0) {
      score += 25; reasons.push({ icon: 'location_on', text: `Lokasi sinkron: "${mLocs[0]}"` });
    }
    const fTitleKw = getKeywords(found.title);
    const fDescKw = getKeywords(found.description);
    const mTitle = lostTitleKw.filter(k => fTitleKw.includes(k));
    const mDesc = lostDescKw.filter(k => fDescKw.includes(k));
    if (mTitle.length > 0) {
      score += 20; reasons.push({ icon: 'text_fields', text: `Judul mirip: "${mTitle.slice(0,2).join(', ')}"` });
    }
    if (mDesc.length > 0) {
      score += Math.min(mDesc.length * 5, 20);
      reasons.push({ icon: 'description', text: `Deskripsi serupa: "${mDesc.slice(0,3).join(', ')}"` });
    }
    const final = Math.min(score, 98);
    if (final > highestScore) {
      highestScore = final;
      bestMatch = found;
      bestReasons = reasons.length > 0 ? reasons : [{ icon: 'auto_awesome', text: 'Kesamaan tipe barang umum' }];
    }
  });
  return { item: bestMatch, score: highestScore, reasons: bestReasons };
};

const AiMatchSimulator = ({ lostItems = [], foundItems = [] }) => {
  const [selectedLostId, setSelectedLostId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [isMatched, setIsMatched] = useState(false);
  const [activeLostItem, setActiveLostItem] = useState(null);
  const [bestFoundItem, setBestFoundItem] = useState(null);
  const [matchRate, setMatchRate] = useState(0);
  const [reasons, setReasons] = useState([]);
  const [noMatch, setNoMatch] = useState(false);
  const scrollRef = useRef(null);
  const initializedRef = useRef(false);

  // New States for Search, Filter & Carousel Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);

  const isReal = lostItems.length > 0;
  const activeLost = isReal ? lostItems : fallbackLostItems;
  const activeFound = isReal ? foundItems : fallbackFoundItems;

  // Filter lost items dynamically based on search query and category
  const filteredLost = React.useMemo(() => {
    return activeLost.filter(item => {
      // 1. Category Filter with fuzzy matching for resilience
      if (selectedCategory !== 'Semua') {
        const itemCat = (item.category || '').toLowerCase();
        const targetCat = selectedCategory.toLowerCase();
        
        const isDocMatch = (targetCat.includes('dokumen') || targetCat.includes('kartu')) && 
          (itemCat.includes('dokumen') || itemCat.includes('kartu') || itemCat.includes('ktm') || itemCat.includes('ktp'));
        const isElecMatch = (targetCat.includes('elektronik') || targetCat.includes('gadget')) && 
          (itemCat.includes('elektronik') || itemCat.includes('gadget') || itemCat.includes('hp') || itemCat.includes('laptop') || itemCat.includes('charger'));
        const isAccMatch = (targetCat.includes('aksesoris') || targetCat.includes('perhiasan')) && 
          (itemCat.includes('aksesoris') || itemCat.includes('perhiasan'));
        const isKeyMatch = targetCat.includes('kunci') && (itemCat.includes('kunci') || itemCat.includes('key'));
        const isOtherMatch = targetCat === 'lainnya' && 
          !itemCat.includes('dokumen') && !itemCat.includes('kartu') && !itemCat.includes('ktm') && !itemCat.includes('ktp') &&
          !itemCat.includes('elektronik') && !itemCat.includes('gadget') && !itemCat.includes('hp') && !itemCat.includes('laptop') && !itemCat.includes('charger') &&
          !itemCat.includes('aksesoris') && !itemCat.includes('perhiasan') && !itemCat.includes('kunci') && !itemCat.includes('key');
          
        if (!isDocMatch && !isElecMatch && !isAccMatch && !isKeyMatch && !isOtherMatch) {
          if (itemCat !== targetCat) return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const loc = (item.location || '').toLowerCase();
        const name = (item.users?.full_name || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || loc.includes(q) || name.includes(q) || cat.includes(q);
      }

      return true;
    });
  }, [activeLost, searchQuery, selectedCategory]);

  // Carousel Pagination Constants & Memos
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredLost.length / ITEMS_PER_PAGE);
  const paginatedLost = React.useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredLost.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLost, currentPage]);

  // Reset page and handle selection when search or category filter changes
  useEffect(() => {
    setCurrentPage(0);
    if (filteredLost.length > 0) {
      const stillExists = filteredLost.some(i => i.id === selectedLostId);
      if (!stillExists) {
        setSelectedLostId(filteredLost[0].id);
      }
    } else {
      setSelectedLostId('');
    }
  }, [searchQuery, selectedCategory]);

  // Initial load selection
  useEffect(() => {
    if (activeLost.length > 0 && !selectedLostId && !initializedRef.current) {
      setSelectedLostId(activeLost[0].id);
      setActiveLostItem(activeLost[0]);
      initializedRef.current = true;
    }
  }, [activeLost, selectedLostId]);

  useEffect(() => {
    if (selectedLostId) {
      const s = activeLost.find(i => i.id === selectedLostId);
      if (s) { 
        setActiveLostItem(s); 
        setIsMatched(false); 
        setNoMatch(false); 
        setBestFoundItem(null); 
        setReasons([]); 
      }
    } else {
      setActiveLostItem(null);
    }
  }, [selectedLostId, activeLost]);

  // Reset horizontal scroll when changing pages or filters
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [currentPage, selectedCategory, searchQuery]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setSlideDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setSlideDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  };

  const startScan = () => {
    if (!activeLostItem || isScanning) return;
    setIsScanning(true); setIsMatched(false); setNoMatch(false); setScanProgress(0);
    setScanStepText('Inisialisasi AI Engine...');
    const result = calculateMatch(activeLostItem, activeFound);
    const steps = [
      { p: 20, t: 'Memindai kategori barang...' },
      { p: 45, t: 'Menganalisis kemiripan lokasi...' },
      { p: 70, t: 'Mencocokkan deskripsi & kata kunci...' },
      { p: 90, t: 'Menghitung skor kecocokan...' },
      { p: 100, t: 'Pencocokan selesai!' }
    ];
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanProgress(step.p); setScanStepText(step.t);
        if (step.p === 100) {
          setTimeout(() => {
            setIsScanning(false);
            if (result && result.score >= 25) {
              setBestFoundItem(result.item); setMatchRate(result.score); setReasons(result.reasons); setIsMatched(true);
            } else {
              setMatchRate(result ? result.score : 0);
              setNoMatch(true);
            }
          }, 500);
        }
      }, (idx + 1) * 600);
    });
  };

  const getScoreColor = (s) => s >= 60 ? 'text-success' : s >= 30 ? 'text-warning' : 'text-error';
  const getScoreBg = (s) => s >= 60 ? 'bg-success/10 border-success/30' : s >= 30 ? 'bg-warning/10 border-warning/30' : 'bg-error/10 border-error/30';
  const getScoreLabel = (s) => s >= 60 ? 'Tinggi' : s >= 30 ? 'Sedang' : 'Rendah';

  return (
    <section className="py-20 bg-gradient-to-b from-surface via-surface-container-low/30 to-surface relative z-10 overflow-hidden">
      {/* Decorative BG Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] -left-20 w-[400px] h-[400px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] -right-20 w-[350px] h-[350px] bg-secondary/8 rounded-full blur-3xl" />
      </div>

      <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4"
          >
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xs font-bold text-primary tracking-wider uppercase">
              Intelligent Matching System
            </span>
            <span className={`w-2 h-2 rounded-full ${isReal ? 'bg-success animate-pulse' : 'bg-outline-variant'}`} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-headline-lg text-headline-lg text-on-surface font-bold"
          >
            Sistem Pencocokan Cerdas
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-on-surface-variant max-w-[560px] mx-auto mt-3 font-body-md leading-relaxed"
          >
            Algoritma AI menganalisis setiap laporan kehilangan dan mencocokkannya dengan barang temuan berdasarkan kategori, lokasi, dan deskripsi secara otomatis.
          </motion.p>
        </div>

        {/* Search and Category Filter Container */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-surface-container-low/60 border border-outline-variant/30 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative w-full md:w-[360px] shrink-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari laporan kehilangan..."
              disabled={isScanning}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-outline-variant/50 bg-surface text-on-surface text-body-medium focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                disabled={isScanning}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none snap-x snap-mandatory">
            {['Semua', 'Dokumen & Kartu', 'Elektronik & Gadget', 'Kunci', 'Aksesoris & Perhiasan', 'Lainnya'].map((cat) => {
              const isCatActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => !isScanning && setSelectedCategory(cat)}
                  disabled={isScanning}
                  className={`snap-start shrink-0 px-4 py-2 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-60 relative overflow-hidden ${
                    isCatActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/30 bg-surface/50 text-on-surface-variant hover:border-outline-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{getCategoryIcon(cat)}</span>
                  {cat === 'Elektronik & Gadget' ? 'Elektronik' : cat === 'Aksesoris & Perhiasan' ? 'Aksesoris' : cat}
                  {isCatActive && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1: Carousel Item Picker */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">touch_app</span>
              </span>
              <span className="font-label-md text-label-md text-on-surface font-bold">Langkah 1:</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Pilih laporan kehilangan</span>
            </div>

            {/* Carousel Navigation Arrows */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-outline mr-1.5">
                  Halaman {currentPage + 1} dari {totalPages}
                </span>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0 || isScanning}
                  className="w-8 h-8 rounded-full border border-outline-variant/40 bg-surface flex items-center justify-center text-outline hover:text-on-surface hover:border-outline disabled:opacity-30 disabled:hover:border-outline-variant/40 disabled:hover:text-outline transition-all cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1 || isScanning}
                  className="w-8 h-8 rounded-full border border-outline-variant/40 bg-surface flex items-center justify-center text-outline hover:text-on-surface hover:border-outline disabled:opacity-30 disabled:hover:border-outline-variant/40 disabled:hover:text-outline transition-all cursor-pointer"
                  title="Halaman Berikutnya"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>

          <div ref={scrollRef} className="relative min-h-[160px] overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1">
            <AnimatePresence mode="wait" custom={slideDirection}>
              <motion.div
                key={currentPage + '_' + selectedCategory + '_' + searchQuery}
                custom={slideDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.15 }
                }}
                className="flex gap-3 pt-3 pb-4 pr-4 scrollbar-none px-1 -mt-3"
              >
                {paginatedLost.length > 0 ? (
                  paginatedLost.map((item) => {
                    const isActive = selectedLostId === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedLostId(item.id)}
                        disabled={isScanning}
                        className={`snap-start shrink-0 w-[200px] p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer group relative overflow-hidden disabled:opacity-60 ${
                          isActive
                            ? 'border-primary bg-primary/5 shadow-[0_4px_20px_rgba(0,40,142,0.12)]'
                            : 'border-outline-variant/40 bg-surface hover:border-primary/40 hover:shadow-md'
                        }`}
                      >
                        {/* Active check indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activePicker"
                            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>
                          </motion.div>
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                          isActive ? 'bg-primary/15 text-primary' : 'bg-surface-container-high/60 text-outline group-hover:text-primary group-hover:bg-primary/10'
                        }`}>
                          <span className="material-symbols-outlined text-xl">{getIcon(item)}</span>
                        </div>
                        <h4 className={`text-sm font-bold mb-1 truncate transition-colors ${
                          isActive ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                        }`}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">person</span>
                          {item.users?.full_name || 'Anonim'}
                        </p>
                        <p className="text-[11px] text-outline truncate flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">location_on</span>
                          {item.location || '-'}
                        </p>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="flex-1 py-8 flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-outline text-3xl mb-2">find_in_page</span>
                    <p className="text-on-surface-variant text-sm font-bold">Tidak ada laporan ditemukan</p>
                    <p className="text-outline text-xs mt-1">Coba sesuaikan kata kunci atau kategori pencarian Anda.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Page Indicators (Dots) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!isScanning) {
                      setSlideDirection(idx > currentPage ? 1 : -1);
                      setCurrentPage(idx);
                    }
                  }}
                  disabled={isScanning}
                  className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                    currentPage === idx
                      ? 'bg-primary w-5'
                      : 'bg-outline-variant/60 hover:bg-outline'
                  }`}
                  title={`Ke Halaman ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Action Button */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </span>
            <span className="font-label-md text-label-md text-on-surface font-bold">Langkah 2:</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Jalankan pencocokan AI</span>
          </div>

          {!isScanning && !isMatched && (
            <motion.button
              whileHover={selectedLostId ? { scale: 1.04, boxShadow: '0 8px 30px rgba(0,40,142,0.2)' } : {}}
              whileTap={selectedLostId ? { scale: 0.96 } : {}}
              onClick={startScan}
              disabled={!selectedLostId}
              className={`bg-gradient-to-r from-primary to-[#1e40af] text-on-primary font-label-md text-label-md px-8 py-3.5 rounded-2xl shadow-lg flex items-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              Jalankan AI Matchmaker
            </motion.button>
          )}

          {/* Scanning Progress Bar */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="bg-surface border border-primary/20 rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,40,142,0.08)] relative overflow-hidden">
                  {/* Animated scan line */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
                  />

                  {/* Header row */}
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border-[2.5px] border-primary/25 border-t-primary animate-spin" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">Memproses Pencocokan AI</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{scanStepText}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-primary/8 px-3.5 py-1.5 rounded-xl">
                      <span className="text-xl font-black text-primary tabular-nums leading-none">{scanProgress}</span>
                      <span className="text-xs font-bold text-primary/70">%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-outline-variant/15 rounded-full overflow-hidden relative z-10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary via-[#3b82f6] to-primary rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse rounded-full" />
                    </motion.div>
                  </div>

                  {/* Progress Steps Dots */}
                  <div className="flex justify-between mt-3 px-1 relative z-10">
                    {['Kategori', 'Lokasi', 'Deskripsi', 'Skor', 'Selesai'].map((label, i) => {
                      const stepThreshold = [0, 20, 45, 70, 100];
                      const isReached = scanProgress >= stepThreshold[i];
                      return (
                        <div key={label} className="flex flex-col items-center gap-1">
                          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isReached ? 'bg-primary scale-125' : 'bg-outline-variant/40'}`} />
                          <span className={`text-[9px] font-semibold transition-colors ${isReached ? 'text-primary' : 'text-outline-variant/60'}`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step 3: No Match Found */}
        <AnimatePresence>
          {noMatch && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120 }}
            >
              <div className="flex items-center gap-2 mb-5 px-1">
                <span className="w-7 h-7 rounded-lg bg-outline-variant/20 flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[18px]">search_off</span>
                </span>
                <span className="font-label-md text-label-md text-on-surface font-bold">Hasil Analisis AI</span>
              </div>

              <div className="bg-surface border border-outline-variant/50 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* Top banner */}
                <div className="bg-surface-container-low/60 border-b border-outline-variant/30 px-8 py-5">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-outline-variant/15 border border-outline-variant/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-3xl text-outline-variant">search_off</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-on-surface mb-1">Tidak Ditemukan Kecocokan</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        AI telah memindai <strong>{activeFound.length}</strong> laporan temuan di database namun tidak menemukan kecocokan signifikan untuk <strong>"{activeLostItem?.title}"</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl">
                      <span className="material-symbols-outlined text-xl text-outline">query_stats</span>
                      <div>
                        <p className="text-lg font-black text-on-surface tabular-nums">{matchRate}%</p>
                        <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">Skor Tertinggi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl">
                      <span className="material-symbols-outlined text-xl text-outline">database</span>
                      <div>
                        <p className="text-lg font-black text-on-surface tabular-nums">{activeFound.length}</p>
                        <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">Data Dipindai</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl">
                      <span className="material-symbols-outlined text-xl text-outline">trending_down</span>
                      <div>
                        <p className="text-lg font-black text-on-surface">&lt; 25%</p>
                        <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">Ambang Batas</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-4 bg-primary/4 border border-primary/15 rounded-xl">
                    <span className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0">lightbulb</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      <strong className="text-on-surface">Saran:</strong> Barang ini mungkin belum dilaporkan sebagai temuan oleh penemu. Coba periksa kembali nanti atau laporkan langsung ke pos keamanan kampus.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => { setNoMatch(false); }}
                  className="text-xs text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Coba Lagi dengan Item Lain
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Match Results */}
        <AnimatePresence>
          {isMatched && bestFoundItem && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120 }}
            >
              <div className="flex items-center gap-2 mb-5 px-1">
                <span className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center text-success">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </span>
                <span className="font-label-md text-label-md text-on-surface font-bold">Hasil Analisis AI</span>
              </div>

              <div className="bg-surface border border-outline-variant/50 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
                
                {/* Score Banner */}
                <div className={`flex items-center justify-center gap-4 py-5 px-6 border-b ${getScoreBg(matchRate)}`}>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getScoreBg(matchRate)} ${getScoreColor(matchRate)}`}
                  >
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {matchRate >= 60 ? 'verified' : matchRate >= 30 ? 'help' : 'warning'}
                    </span>
                  </motion.div>
                  <div className="text-left">
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 8, delay: 0.2 }}
                        className={`text-4xl font-black tabular-nums ${getScoreColor(matchRate)}`}
                      >
                        {matchRate}%
                      </motion.span>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getScoreBg(matchRate)} ${getScoreColor(matchRate)}`}>
                        {getScoreLabel(matchRate)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">Skor kecocokan AI terhadap {activeFound.length} laporan temuan</p>
                  </div>
                </div>

                {/* Two Column Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
                  
                  {/* Lost Item Column */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-error" />
                      <span className="text-[11px] font-bold text-error uppercase tracking-wider">Barang Hilang</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-error/8 border border-error/15 flex items-center justify-center text-error shrink-0">
                        <span className="material-symbols-outlined text-2xl">{getIcon(activeLostItem)}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{activeLostItem?.title}</h4>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-outline">person</span>
                          {activeLostItem?.users?.full_name || 'Anonim'}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                          {activeLostItem?.location || '-'}
                        </p>
                        <p className="text-[11px] text-outline mt-2 line-clamp-2 leading-relaxed italic">
                          "{activeLostItem?.description}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Found Item Column */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-[11px] font-bold text-success uppercase tracking-wider">Barang Temuan Paling Cocok</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-success/8 border border-success/15 flex items-center justify-center text-success shrink-0">
                        <span className="material-symbols-outlined text-2xl">{getIcon(bestFoundItem)}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">{bestFoundItem.title}</h4>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-outline">person</span>
                          {bestFoundItem.users?.full_name || 'Anonim'}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                          {bestFoundItem.location || '-'}
                        </p>
                        <p className="text-[11px] text-outline mt-2 line-clamp-2 leading-relaxed italic">
                          "{bestFoundItem.description}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Tags */}
                <div className="px-6 pb-6 pt-2">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Alasan Kecocokan AI</p>
                  <div className="flex flex-wrap gap-2">
                    {reasons.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low border border-outline-variant/40 rounded-full"
                      >
                        <span className="material-symbols-outlined text-success text-[14px]">{r.icon}</span>
                        <span className="text-[11px] text-on-surface-variant font-medium">{r.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Reset */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => { setIsMatched(false); setBestFoundItem(null); setReasons([]); }}
                  className="text-xs text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Coba Lagi dengan Item Lain
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};

export default AiMatchSimulator;
