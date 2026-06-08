import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fallback mockup data in case database is empty
const fallbackLostItems = [
  {
    id: 'mock-lost-1',
    title: 'KTM UIN Suska Riau',
    users: { full_name: 'Reza Amanda' },
    location: 'Perpustakaan Lt. 2',
    category: 'Kartu/Dokumen',
    description: 'KTM atas nama Reza Amanda, NIM 12250111xxx, Fakultas Tarbiyah.',
    status: 'lost',
    icon: 'badge'
  },
  {
    id: 'mock-lost-2',
    title: 'Kunci Vario Hitam',
    users: { full_name: 'Dian Saputra' },
    location: 'Parkiran Tarbiyah',
    category: 'Lainnya',
    description: 'Kunci motor Honda dengan gantungan kulit coklat bertuliskan Eiger.',
    status: 'lost',
    icon: 'key'
  },
  {
    id: 'mock-lost-3',
    title: 'Dompet Eiger Coklat',
    users: { full_name: 'Rian Hidayat' },
    location: 'Masjid Al-Jamiah',
    category: 'Lainnya',
    description: 'Dompet kulit coklat merk Eiger berisi KTP, KTM, dan uang tunai.',
    status: 'lost',
    icon: 'account_balance_wallet'
  }
];

const fallbackFoundItems = [
  {
    id: 'mock-found-1',
    title: 'Kartu Tanda Mahasiswa UIN',
    users: { full_name: 'Fajar Pratama' },
    location: 'Meja Belajar Perpustakaan',
    category: 'Kartu/Dokumen',
    description: 'Ditemukan KTM UIN Suska di perpus lt 2 atas nama Reza A.',
    status: 'found',
    icon: 'badge'
  },
  {
    id: 'mock-found-2',
    title: 'Kunci Motor Honda & Gantungan',
    users: { full_name: 'Siti Rahma' },
    location: 'Parkiran Tarbiyah Dekat Pohon',
    category: 'Lainnya',
    description: 'Ditemukan kunci motor Honda dengan dompet gantungan kulit coklat.',
    status: 'found',
    icon: 'key'
  },
  {
    id: 'mock-found-3',
    title: 'Dompet Kulit Pria Cokelat',
    users: { full_name: 'Ahmad Fauzi' },
    location: 'Tempat Wudhu Masjid',
    category: 'Lainnya',
    description: 'Menemukan dompet kulit warna coklat di area tempat wudhu masjid kampus.',
    status: 'found',
    icon: 'account_balance_wallet'
  }
];

const AiMatchSimulator = ({ lostItems = [], foundItems = [] }) => {
  const [isUsingRealData, setIsUsingRealData] = useState(false);
  const [selectedLostId, setSelectedLostId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [isMatched, setIsMatched] = useState(false);

  // Match result states
  const [activeLostItem, setActiveLostItem] = useState(null);
  const [bestFoundItem, setBestFoundItem] = useState(null);
  const [matchRate, setMatchRate] = useState(0);
  const [reasons, setReasons] = useState([]);

  // Determine active lists
  const activeLostList = lostItems.length > 0 ? lostItems : fallbackLostItems;
  const activeFoundList = foundItems.length > 0 ? foundItems : fallbackFoundItems;

  useEffect(() => {
    setIsUsingRealData(lostItems.length > 0);
    if (activeLostList.length > 0) {
      setSelectedLostId(activeLostList[0].id);
      setActiveLostItem(activeLostList[0]);
    }
  }, [lostItems, foundItems]);

  useEffect(() => {
    if (selectedLostId) {
      const selected = activeLostList.find(item => item.id === selectedLostId);
      if (selected) {
        setActiveLostItem(selected);
        setIsMatched(false); // Reset match state when selection changes
      }
    }
  }, [selectedLostId]);

  // Keyword helper for similarity check
  const getKeywords = (text = '') => {
    const commonWords = ['barang', 'yang', 'dengan', 'untuk', 'pada', 'dan', 'atau', 'saya', 'oleh', 'dari', 'bisa', 'ada', 'di'];
    return text
      .toLowerCase()
      .split(/[\s,./?()]+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
  };

  const calculateMatch = (lost, foundList) => {
    if (!lost || foundList.length === 0) return null;

    let bestMatch = null;
    let highestScore = 0;
    let bestReasons = [];

    const lostTitleKeywords = getKeywords(lost.title);
    const lostDescKeywords = getKeywords(lost.description);
    const lostLocKeywords = getKeywords(lost.location);

    foundList.forEach(found => {
      let score = 10; // baseline score
      const currentReasons = [];

      // 1. Category check
      if (lost.category && found.category && lost.category === found.category && lost.category !== 'Lainnya') {
        score += 35;
        currentReasons.push(`Kategori barang identik: "${lost.category}"`);
      }

      // 2. Location keyword intersection
      const foundLocKeywords = getKeywords(found.location);
      const matchingLocs = lostLocKeywords.filter(k => foundLocKeywords.includes(k));
      if (matchingLocs.length > 0) {
        score += 25;
        currentReasons.push(`Lokasi kejadian sinkron di sekitar "${found.location}"`);
      }

      // 3. Title & Description keyword intersection
      const foundTitleKeywords = getKeywords(found.title);
      const foundDescKeywords = getKeywords(found.description);

      const matchingTitle = lostTitleKeywords.filter(k => foundTitleKeywords.includes(k));
      const matchingDesc = lostDescKeywords.filter(k => foundDescKeywords.includes(k));

      if (matchingTitle.length > 0) {
        score += 20;
        currentReasons.push(`Judul barang memiliki kemiripan kata kunci: "${matchingTitle.slice(0, 2).join(', ')}"`);
      }
      if (matchingDesc.length > 0) {
        const points = Math.min(matchingDesc.length * 5, 20);
        score += points;
        currentReasons.push(`Ditemukan kata kunci deskripsi serupa: "${matchingDesc.slice(0, 3).join(', ')}"`);
      }

      // Cap at 98%
      const finalScore = Math.min(score, 98);

      if (finalScore > highestScore) {
        highestScore = finalScore;
        bestMatch = found;
        bestReasons = currentReasons.length > 0 ? currentReasons : ["Kesamaan tipe barang secara umum di lingkungan kampus"];
      }
    });

    return {
      item: bestMatch,
      score: highestScore,
      reasons: bestReasons
    };
  };

  const startSimulation = () => {
    if (!activeLostItem) return;

    setIsScanning(true);
    setIsMatched(false);
    setScanProgress(0);
    setScanStepText('Mengambil data laporan...');

    const result = calculateMatch(activeLostItem, activeFoundList);

    const steps = [
      { progress: 25, text: 'Memindai kategori barang di database...' },
      { progress: 60, text: 'Menganalisis kemiripan lokasi penemuan...' },
      { progress: 85, text: 'Mencocokkan kata kunci deskripsi dan metadata...' },
      { progress: 100, text: 'Koneksi pencocokan AI berhasil!' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanProgress(step.progress);
        setScanStepText(step.text);
        if (step.progress === 100) {
          setTimeout(() => {
            setIsScanning(false);
            if (result) {
              setBestFoundItem(result.item);
              setMatchRate(result.score);
              setReasons(result.reasons);
              setIsMatched(true);
            }
          }, 600);
        }
      }, (idx + 1) * 700);
    });
  };

  const getIcon = (item) => {
    if (!item) return 'inventory_2';
    if (item.icon) return item.icon;
    const title = (item.title || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    if (cat.includes('kartu') || title.includes('ktm') || title.includes('kartu')) return 'badge';
    if (title.includes('kunci') || title.includes('key')) return 'key';
    if (title.includes('dompet') || title.includes('wallet')) return 'account_balance_wallet';
    if (title.includes('hp') || title.includes('phone') || title.includes('handphone')) return 'phone_android';
    if (title.includes('tas') || title.includes('bag') || title.includes('ransel')) return 'backpack';
    return 'inventory_2';
  };

  return (
    <section className="py-20 bg-surface-container-low/40 relative z-10 border-t border-b border-outline-variant/30">
      <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        
        {/* Title */}
        <div className="mb-12 text-center">
          <span className="font-label-md text-label-md text-primary tracking-widest uppercase mb-2">
            {isUsingRealData ? 'Fitur AI Riil' : 'Fitur AI Pintar'}
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            {isUsingRealData ? 'AI Auto-Matchmaker (Pencocokan Riil)' : 'Simulasi AI Auto-Matchmaker'}
          </h2>
          <p className="text-on-surface-variant max-w-[576px] mx-auto mt-3 font-body-md">
            {isUsingRealData 
              ? 'Pilih salah satu laporan kehilangan aktif untuk mencari barang temuan yang paling cocok secara langsung dari database.'
              : 'Bagaimana AI bekerja di balik layar memindai kemiripan antara laporan kehilangan dan temuan secara otomatis.'}
          </p>
          <div className="w-12 h-1 bg-primary rounded-full mx-auto mt-4"></div>
        </div>

        {/* Real Data Indicator Badge */}
        <div className="flex justify-center mb-6">
          <span className={`text-xs font-bold px-4 py-1.5 rounded-full border flex items-center gap-1.5 shadow-sm ${
            isUsingRealData 
              ? 'bg-success-container text-on-success-container border-success/30' 
              : 'bg-surface border-outline-variant text-on-surface-variant/80'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isUsingRealData ? 'bg-success animate-pulse' : 'bg-outline-variant'}`} />
            {isUsingRealData ? 'Mode: Database Riil Aktif' : 'Mode: Demo Simulasi'}
          </span>
        </div>

        {/* Dropdown Selector */}
        <div className="flex flex-col items-center max-w-md mx-auto mb-10 w-full px-4">
          <label className="font-label-sm text-label-sm text-outline mb-2 block font-semibold uppercase tracking-wider">
            Pilih Laporan Barang Hilang:
          </label>
          <select
            value={selectedLostId}
            onChange={(e) => setSelectedLostId(e.target.value)}
            disabled={isScanning}
            className="w-full bg-surface border border-outline-variant/60 rounded-2xl px-4 py-3 text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-left cursor-pointer shadow-sm hover:border-outline transition-all"
          >
            {activeLostList.map(item => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.users?.full_name || 'Pelapor'})
              </option>
            ))}
          </select>
        </div>

        {/* Simulator Dashboard */}
        <div className="bg-surface border border-outline-variant/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-10 relative overflow-hidden max-w-[900px] mx-auto">
          
          {/* Laser Scanning Effect */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#295bc7] z-20 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
            
            {/* Left Card: Selected Lost Item */}
            <div className="md:col-span-4 flex flex-col">
              <div className="text-xs font-bold text-error uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                Barang Hilang
              </div>
              <div className={`bg-surface-container-low border rounded-2xl p-5 transition-all duration-300 min-h-[240px] flex flex-col justify-between ${
                isScanning ? 'border-primary/40 shadow-[0_0_20px_rgba(40,91,199,0.05)] scale-98' : 'border-outline-variant/60'
              }`}>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error mb-4">
                    <span className="material-symbols-outlined text-2xl">{getIcon(activeLostItem)}</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 truncate text-left">
                    {activeLostItem ? activeLostItem.title : '-'}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-2 text-left">
                    <span className="material-symbols-outlined text-sm text-outline">person</span>
                    Pelapor: {activeLostItem?.users?.full_name || 'Anonim'}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-3 text-left">
                    <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                    Lokasi: {activeLostItem?.location || 'Tidak diketahui'}
                  </p>
                </div>
                <p className="font-body-sm text-body-sm text-outline leading-relaxed border-t border-outline-variant/30 pt-3 text-left line-clamp-3">
                  "{activeLostItem?.description || 'Tidak ada deskripsi.'}"
                </p>
              </div>
            </div>

            {/* Middle Action Circle */}
            <div className="md:col-span-3 flex flex-col items-center justify-center py-4 relative">
              <AnimatePresence mode="wait">
                {isScanning ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center text-center z-10"
                  >
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                    <div className="text-sm font-bold text-primary animate-pulse">{scanProgress}%</div>
                    <div className="text-[11px] text-on-surface-variant mt-2 font-medium max-w-[150px] leading-tight h-8">
                      {scanStepText}
                    </div>
                  </motion.div>
                ) : isMatched && bestFoundItem ? (
                  <motion.div
                    key="match-success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="flex flex-col items-center text-center z-10"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mb-3 shadow-[0_0_20px_rgba(0,170,100,0.15)]"
                    >
                      <span className="material-symbols-outlined text-3xl font-bold">verified</span>
                    </motion.div>
                    
                    <span className="text-[11px] font-bold tracking-widest text-success uppercase mb-1">Skor AI</span>
                    <h3 className="font-headline-md text-headline-md text-success font-black leading-none mb-2">
                      {matchRate}%
                    </h3>
                    
                    <span className="text-xs bg-success-container text-on-success-container border border-success/20 px-3 py-1 rounded-full font-bold">
                      Kecocokan Ditemukan
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-surface-container-high/70 border border-outline-variant/60 flex items-center justify-center text-outline mb-4">
                      <span className="material-symbols-outlined text-2xl">insights</span>
                    </div>
                    <button
                      onClick={startSimulation}
                      className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all font-label-md text-label-md px-5 py-2.5 rounded-xl cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      Jalankan AI Match
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Card: Matching Found Item */}
            <div className="md:col-span-4 flex flex-col">
              <div className="text-xs font-bold text-success uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                Barang Temuan
              </div>
              <div className={`bg-surface-container-low border rounded-2xl p-5 transition-all duration-300 min-h-[240px] flex flex-col justify-between ${
                isScanning ? 'border-primary/40 shadow-[0_0_20px_rgba(40,91,199,0.05)] scale-98' : 'border-outline-variant/60'
              }`}>
                {isMatched && bestFoundItem ? (
                  <>
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success mb-4">
                        <span className="material-symbols-outlined text-2xl">{getIcon(bestFoundItem)}</span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 truncate text-left">
                        {bestFoundItem.title}
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-2 text-left">
                        <span className="material-symbols-outlined text-sm text-outline">person</span>
                        Finder: {bestFoundItem.users?.full_name || 'Anonim'}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-3 text-left">
                        <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                        Lokasi: {bestFoundItem.location || 'Tidak diketahui'}
                      </p>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline leading-relaxed border-t border-outline-variant/30 pt-3 text-left line-clamp-3">
                      "{bestFoundItem.description || 'Tidak ada deskripsi.'}"
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-grow text-center text-outline/40 py-10">
                    <span className="material-symbols-outlined text-[48px] mb-2">find_in_page</span>
                    <p className="text-xs font-semibold">Menunggu analisis AI</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Dynamic Match Analysis Reasons */}
          <AnimatePresence>
            {isMatched && reasons.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-8 border-t border-outline-variant/50 pt-6"
              >
                <h4 className="font-label-md text-label-md text-primary font-bold mb-3 uppercase tracking-wider text-left">
                  Analisis Kesesuaian Algoritma AI:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {reasons.map((reason, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 flex gap-2 items-start text-left"
                    >
                      <span className="material-symbols-outlined text-success text-[18px] mt-0.5 select-none">check_circle</span>
                      <span className="text-xs text-on-surface-variant font-medium leading-relaxed">
                        {reason}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </section>
  );
};

export default AiMatchSimulator;
