import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testCases = [
  {
    id: 1,
    name: 'KTM Mahasiswa UIN',
    lost: {
      title: 'KTM UIN Suska Riau',
      owner: 'Reza Amanda',
      location: 'Perpustakaan Lt. 2',
      details: 'KTM atas nama Reza Amanda, NIM 12250111xxx, Fakultas Tarbiyah.',
      image: null,
      icon: 'badge'
    },
    found: {
      title: 'Kartu Tanda Mahasiswa UIN',
      finder: 'Fajar Pratama',
      location: 'Meja Belajar Perpustakaan',
      details: 'Ditemukan KTM UIN Suska di perpus lt 2 atas nama Reza A.',
      image: null,
      icon: 'badge'
    },
    matchRate: 96,
    reasons: [
      'Nama Pelapor cocok (Reza Amanda)',
      'Lokasi kejadian sangat dekat (Perpustakaan)',
      'Tipe dokumen cocok (KTM Mahasiswa)'
    ]
  },
  {
    id: 2,
    name: 'Kunci Motor Honda',
    lost: {
      title: 'Kunci Honda Vario Black',
      owner: 'Dian Saputra',
      location: 'Parkiran Tarbiyah',
      details: 'Kunci motor Honda dengan gantungan kulit coklat bertuliskan Eiger.',
      image: null,
      icon: 'key'
    },
    found: {
      title: 'Kunci Motor Honda & Gantungan',
      finder: 'Siti Rahma',
      location: 'Parkiran Tarbiyah Dekat Pohon',
      details: 'Ditemukan kunci motor Honda dengan dompet gantungan kulit coklat.',
      image: null,
      icon: 'key'
    },
    matchRate: 92,
    reasons: [
      'Merk kunci cocok (Honda)',
      'Aksesoris gantungan kulit coklat identik',
      'Lokasi penemuan persis (Parkiran Tarbiyah)'
    ]
  },
  {
    id: 3,
    name: 'Dompet Kulit Eiger',
    lost: {
      title: 'Dompet Eiger Coklat',
      owner: 'Rian Hidayat',
      location: 'Masjid Al-Jamiah',
      details: 'Dompet kulit coklat merk Eiger berisi KTP, KTM, dan uang tunai.',
      image: null,
      icon: 'account_balance_wallet'
    },
    found: {
      title: 'Dompet Kulit Pria Cokelat',
      finder: 'Ahmad Fauzi',
      location: 'Tempat Wudhu Masjid',
      details: 'Menemukan dompet kulit warna coklat di area tempat wudhu masjid kampus.',
      image: null,
      icon: 'account_balance_wallet'
    },
    matchRate: 89,
    reasons: [
      'Bahan & warna dompet identik (Kulit Coklat)',
      'Lokasi kejadian sinkron (Masjid Al-Jamiah)',
      'Isi identitas dalam dompet sesuai data pelapor'
    ]
  }
];

const AiMatchSimulator = () => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [isMatched, setIsMatched] = useState(false);

  const activeCase = testCases[activeCaseIndex];

  const startSimulation = () => {
    setIsScanning(true);
    setIsMatched(false);
    setScanProgress(0);
    setScanStepText('Memulai pencocokan AI...');

    const steps = [
      { progress: 20, text: 'Menganalisis kategori barang...' },
      { progress: 50, text: 'Membandingkan kecocokan nama & deskripsi...' },
      { progress: 80, text: 'Memvalidasi kesesuaian lokasi kejadian...' },
      { progress: 100, text: 'Pencocokan selesai!' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanProgress(step.progress);
        setScanStepText(step.text);
        if (step.progress === 100) {
          setTimeout(() => {
            setIsScanning(false);
            setIsMatched(true);
          }, 600);
        }
      }, (idx + 1) * 700);
    });
  };

  const changeCase = (index) => {
    setActiveCaseIndex(index);
    setIsScanning(false);
    setIsMatched(false);
    setScanProgress(0);
    setScanStepText('');
  };

  return (
    <section className="py-20 bg-surface-container-low/40 relative z-10 border-t border-b border-outline-variant/30">
      <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        
        {/* Title */}
        <div className="mb-12 text-center">
          <span className="font-label-md text-label-md text-primary tracking-widest uppercase mb-2">Fitur AI Pintar</span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Simulasi AI Auto-Matchmaker</h2>
          <p className="text-on-surface-variant max-w-[576px] mx-auto mt-3 font-body-md">
            Bagaimana AI kami bekerja di balik layar memindai kemiripan antara laporan kehilangan dan temuan secara otomatis.
          </p>
          <div className="w-12 h-1 bg-primary rounded-full mx-auto mt-4"></div>
        </div>

        {/* Case Selectors */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {testCases.map((tc, idx) => (
            <button
              key={tc.id}
              onClick={() => changeCase(idx)}
              disabled={isScanning}
              className={`px-5 py-2.5 rounded-full font-label-md text-label-md font-semibold transition-all cursor-pointer border ${
                activeCaseIndex === idx
                  ? 'bg-primary text-on-primary border-primary shadow-md'
                  : 'bg-surface hover:bg-surface-container-high text-on-surface border-outline-variant/50'
              } disabled:opacity-50`}
            >
              Simulasi: {tc.name}
            </button>
          ))}
        </div>

        {/* Simulator Area */}
        <div className="bg-surface border border-outline-variant/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-10 relative overflow-hidden max-w-[900px] mx-auto">
          
          {/* Laser Scanning Effect Layer */}
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
            
            {/* Left Card: Lost Item */}
            <div className="md:col-span-4 flex flex-col">
              <div className="text-xs font-bold text-error uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                Barang Hilang (Laporan)
              </div>
              <div className={`bg-surface-container-low border rounded-2xl p-5 transition-all duration-300 ${
                isScanning ? 'border-primary/40 shadow-[0_0_20px_rgba(40,91,199,0.05)] scale-98' : 'border-outline-variant/60'
              }`}>
                <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error mb-4">
                  <span className="material-symbols-outlined text-2xl">{activeCase.lost.icon}</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 truncate text-left">{activeCase.lost.title}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-2 text-left">
                  <span className="material-symbols-outlined text-sm text-outline">person</span>
                  Owner: {activeCase.lost.owner}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-3 text-left">
                  <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                  Lokasi: {activeCase.lost.location}
                </p>
                <p className="font-body-sm text-body-sm text-outline leading-relaxed border-t border-outline-variant/30 pt-3 text-left">
                  "{activeCase.lost.details}"
                </p>
              </div>
            </div>

            {/* Middle Match Action Area */}
            <div className="md:col-span-3 flex flex-col items-center justify-center py-4 relative">
              <AnimatePresence mode="wait">
                {isScanning ? (
                  /* Loading Scanner */
                  <motion.div
                    key="scanning-ui"
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
                ) : isMatched ? (
                  /* Success/Match Found UI */
                  <motion.div
                    key="match-ui"
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
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
                    
                    <span className="text-[11px] font-bold tracking-widest text-success uppercase mb-1">Kecocokan AI</span>
                    <h3 className="font-headline-md text-headline-md text-success font-black leading-none mb-2">
                      {activeCase.matchRate}%
                    </h3>
                    
                    <span className="text-xs bg-success-container text-on-success-container border border-success/20 px-3 py-1 rounded-full font-bold">
                      Match Sesuai!
                    </span>
                  </motion.div>
                ) : (
                  /* Inactive / Start Button UI */
                  <motion.div
                    key="start-ui"
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
                      className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all font-label-md text-label-md px-4 py-2.5 rounded-xl cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      Jalankan AI Match
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Card: Found Item */}
            <div className="md:col-span-4 flex flex-col">
              <div className="text-xs font-bold text-success uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center md:justify-start">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                Barang Temuan (Laporan)
              </div>
              <div className={`bg-surface-container-low border rounded-2xl p-5 transition-all duration-300 ${
                isScanning ? 'border-primary/40 shadow-[0_0_20px_rgba(40,91,199,0.05)] scale-98' : 'border-outline-variant/60'
              }`}>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success mb-4">
                  <span className="material-symbols-outlined text-2xl">{activeCase.found.icon}</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 truncate text-left">{activeCase.found.title}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-2 text-left">
                  <span className="material-symbols-outlined text-sm text-outline">person</span>
                  Finder: {activeCase.found.finder}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mb-3 text-left">
                  <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                  Lokasi: {activeCase.found.location}
                </p>
                <p className="font-body-sm text-body-sm text-outline leading-relaxed border-t border-outline-variant/30 pt-3 text-left">
                  "{activeCase.found.details}"
                </p>
              </div>
            </div>

          </div>

          {/* Collapsible Match Analysis Details */}
          <AnimatePresence>
            {isMatched && (
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
                  {activeCase.reasons.map((reason, i) => (
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
