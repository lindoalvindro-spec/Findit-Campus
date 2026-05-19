import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const Home = () => {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  // Real database stats state
  const [stats, setStats] = useState({
    total: 0,
    returned: 0,
    lost: 0,
    successRate: 0
  });

  useEffect(() => {
    const fetchDataAndStats = async () => {
      setLoading(true);
      
      // 1. Fetch top 3 recent lost items
      const { data: lostData, error: lostError } = await supabase
        .from('lost_items')
        .select('*')
        .eq('status', 'lost')
        .order('created_at', { ascending: false })
        .limit(3);

      // 2. Fetch top 3 recent found items
      const { data: foundData, error: foundError } = await supabase
        .from('lost_items')
        .select('*')
        .eq('status', 'found')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!lostError && lostData) setLostItems(lostData);
      if (!foundError && foundData) setFoundItems(foundData);

      // 3. Fetch real database statistics
      try {
        // Total reports
        const { count: totalCount, error: totalErr } = await supabase
          .from('lost_items')
          .select('*', { count: 'exact', head: true });

        // Currently being searched (status is 'lost')
        const { count: lostCount, error: lostErr } = await supabase
          .from('lost_items')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'lost');

        // Returned / Claimed items (status is 'returned' or 'claimed')
        const { count: returnedCount, error: returnedErr } = await supabase
          .from('lost_items')
          .select('*', { count: 'exact', head: true })
          .in('status', ['returned', 'claimed']);

        const total = totalCount || 0;
        const lost = lostCount || 0;
        const returned = returnedCount || 0;
        const successRate = total > 0 ? Math.round((returned / total) * 100) : 0;

        setStats({
          total,
          lost,
          returned,
          successRate // Default to 0% if no reports yet
        });
      } catch (err) {
        console.error("Gagal memuat statistik database:", err);
      }

      setLoading(false);
    };

    fetchDataAndStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/lost-items?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/lost-items');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-surface-container-low overflow-hidden py-24 md:py-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto relative z-10 flex flex-col items-center text-center"
          >
            <h1 className="font-headline-xl text-headline-xl text-primary mb-4 max-w-3xl">Temukan Barangmu, Bantu Temanmu.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-2xl">Platform resmi pencarian barang hilang dan temuan di area kampus.</p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl bg-surface rounded-full shadow-sm border border-outline-variant flex items-center p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-fixed transition-all">
              <span className="material-symbols-outlined text-outline ml-4">search</span>
              <input 
                className="flex-grow bg-transparent border-none focus:ring-0 font-body-md text-body-md px-4 text-on-surface placeholder:text-outline focus:outline-none" 
                placeholder="Cari barang hilang atau temuan..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-colors transform hover:scale-105 active:scale-95">
                Cari
              </button>
            </form>
          </motion.div>
          
          {/* Decorative background elements */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Animated Blobs */}
            <div className="absolute top-[10%] left-[10%] w-72 md:w-96 h-72 md:h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-[10%] right-[10%] w-72 md:w-96 h-72 md:h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
            <div className="absolute -bottom-8 left-[30%] w-72 md:w-96 h-72 md:h-96 bg-tertiary-container/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
            
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBWMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yMCAwTDIwIDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0wIDIwaDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-50"></div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-12 bg-surface">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {}
              }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-surface-container rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform duration-300">
                <div className="font-headline-lg text-headline-lg text-primary mb-2">
                  {loading ? '...' : stats.total.toLocaleString('id-ID')}
                </div>
                <div className="font-label-md text-label-md text-on-surface-variant">Total Laporan</div>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-surface-container rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform duration-300">
                <div className="font-headline-lg text-headline-lg text-secondary mb-2">
                  {loading ? '...' : stats.returned.toLocaleString('id-ID')}
                </div>
                <div className="font-label-md text-label-md text-on-surface-variant">Barang Kembali</div>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-surface-container rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform duration-300">
                <div className="font-headline-lg text-headline-lg text-primary mb-2">
                  {loading ? '...' : stats.lost.toLocaleString('id-ID')}
                </div>
                <div className="font-label-md text-label-md text-on-surface-variant">Sedang Dicari</div>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-surface-container rounded-xl p-6 text-center border border-outline-variant shadow-sm hover:-translate-y-1 transition-transform duration-300">
                <div className="font-headline-lg text-headline-lg text-secondary mb-2">
                  {loading ? '...' : `${stats.successRate}%`}
                </div>
                <div className="font-label-md text-label-md text-on-surface-variant">Tingkat Sukses</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 bg-surface-container-lowest">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-headline-md text-headline-md text-on-surface mb-12"
            >
              Cara Kerja
            </motion.h2>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{ visible: { transition: { staggerChildren: 0.2 } }, hidden: {} }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative"
            >
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-outline-variant -z-10 -translate-y-1/2"></div>
              
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-4 z-10 border-4 border-surface-container-lowest shadow-md hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-3xl">edit_document</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Lapor</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px]">Buat laporan detail mengenai barang yang hilang atau Anda temukan.</p>
              </motion.div>
              
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface mb-4 z-10 border-4 border-surface-container-lowest shadow-md hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-3xl">fact_check</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Verifikasi</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px]">Sistem mencocokkan data dan memfasilitasi komunikasi aman.</p>
              </motion.div>
              
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container mb-4 z-10 border-4 border-surface-container-lowest shadow-md hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-3xl">handshake</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Kembali</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px]">Bertemu di lokasi aman kampus untuk mengembalikan barang.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Recent Lost Items */}
        <section className="py-16 bg-surface">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Barang Hilang Terbaru</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Bantu teman menemukan barang mereka.</p>
              </div>
              <Link className="text-primary font-label-md text-label-md hover:underline flex items-center" to="/lost-items">
                Lihat Semua <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
              </Link>
            </div>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.15 } }, hidden: {} }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {loading ? (
                <div className="col-span-full py-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
                  <p>Memuat data...</p>
                </div>
              ) : lostItems.length === 0 ? (
                <div className="col-span-full py-xl text-center text-on-surface-variant bg-surface-container rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 opacity-50">search_off</span>
                  <p>Belum ada laporan barang hilang terbaru.</p>
                </div>
              ) : (
                lostItems.map((item) => (
                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} key={item.id}>
                    <Link to={`/item-detail?id=${item.id}`} className="block bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
                      <div className="h-48 bg-surface-container flex items-center justify-center relative overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <span className="material-symbols-outlined text-[64px] text-outline-variant opacity-50">inventory_2</span>
                        )}
                        <div className="absolute top-3 right-3 bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold z-10 shadow-sm">
                          Hilang
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1 truncate group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">location_on</span> {item.location || 'Tidak diketahui'}</p>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant">
                          <span className="font-label-sm text-label-sm text-outline">{item.date_lost ? new Date(item.date_lost).toLocaleDateString('id-ID') : '-'}</span>
                          <span className="text-primary font-label-md text-label-md bg-primary/5 group-hover:bg-primary group-hover:text-on-primary px-4 py-1.5 rounded-full transition-all duration-300">Detail</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </section>

        {/* Recent Found Items */}
        <section className="py-16 bg-surface-container-lowest">
          <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Barang Temuan Terbaru</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">Cek jika barang Anda ada di sini.</p>
              </div>
              <Link className="text-primary font-label-md text-label-md hover:underline flex items-center" to="/lost-items">
                Lihat Semua <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
              </Link>
            </div>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.15 } }, hidden: {} }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {loading ? (
                <div className="col-span-full py-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
                  <p>Memuat data...</p>
                </div>
              ) : foundItems.length === 0 ? (
                <div className="col-span-full py-xl text-center text-on-surface-variant bg-surface-container rounded-xl border border-outline-variant">
                  <span className="material-symbols-outlined text-3xl mb-2 opacity-50">search_off</span>
                  <p>Belum ada laporan barang temuan terbaru.</p>
                </div>
              ) : (
                foundItems.map((item) => (
                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} key={item.id}>
                    <Link to={`/item-detail?id=${item.id}`} className="block bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
                      <div className="h-48 bg-surface-container flex items-center justify-center relative overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <span className="material-symbols-outlined text-[64px] text-outline-variant opacity-50">inventory_2</span>
                        )}
                        <div className="absolute top-3 right-3 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold z-10 shadow-sm">
                          Ditemukan
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1 truncate group-hover:text-secondary transition-colors">{item.title}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">location_on</span> {item.location || 'Tidak diketahui'}</p>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline-variant">
                          <span className="font-label-sm text-label-sm text-outline">{item.date_lost ? new Date(item.date_lost).toLocaleDateString('id-ID') : '-'}</span>
                          <span className="text-secondary font-label-md text-label-md bg-secondary/5 group-hover:bg-secondary group-hover:text-on-secondary px-4 py-1.5 rounded-full transition-all duration-300">Detail</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
