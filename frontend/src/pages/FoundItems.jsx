import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { motion } from 'framer-motion';
import uinLogo from '../assets/uin.png';
import unriLogo from '../assets/unri.png';
import uirLogo from '../assets/uir.png';
import umriLogo from '../assets/umri.jpg';

const FoundItems = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCampus = searchParams.get('campus') || '';
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState(initialCampus);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const campuses = [
    { name: '', displayName: 'Semua Kampus', logo: null, icon: 'location_city' },
    { name: 'UIN Suska Riau', displayName: 'UIN Suska Riau', logo: uinLogo },
    { name: 'Universitas Riau (UNRI)', displayName: 'UNRI', logo: unriLogo },
    { name: 'Universitas Islam Riau (UIR)', displayName: 'UIR', logo: uirLogo },
    { name: 'Universitas Muhammadiyah Riau (UMRI)', displayName: 'UMRI', logo: umriLogo },
    { name: 'Lainnya', displayName: 'Lainnya', logo: null, icon: 'school' }
  ];
  
  // Perbarui parameter URL ketika searchQuery atau campusFilter berubah
  useEffect(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (campusFilter) params.campus = campusFilter;
    setSearchParams(params, { replace: true });
  }, [searchQuery, campusFilter, setSearchParams]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await apiClient.get('/api/items?status=found');
      
      if (!error && data) {
        setItems(data);
      } else {
        console.error("Error fetching found items:", error);
      }
      setLoading(false);
    };

    fetchItems();
  }, []);


  const filteredItems = items.filter(item => {
    const matchQuery = (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                       (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    // Asumsi category di DB berupa string, kita cek substring saja
    const matchCategory = categoryFilter ? (item.category?.toLowerCase() || '').includes(categoryFilter.toLowerCase()) : true;

    // Filter berdasarkan kampus
    const matchCampus = campusFilter ? item.campus === campusFilter : true;
    
    return matchQuery && matchCategory && matchCampus;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, campusFilter]);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        {/* Page Header */}
        <div className="mb-lg relative rounded-3xl overflow-hidden bg-gradient-to-b from-surface-container-low via-surface-container-low to-surface border border-outline-variant/60 p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <div className="relative z-10">
            <span className="font-label-md text-label-md text-secondary tracking-widest uppercase mb-2 block font-semibold">Cari & Temukan</span>
            <h1 className="font-headline-xl text-headline-xl text-on-surface mb-4 font-bold leading-tight">
              Daftar <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#008f5d] to-[#16a34a]">Barang Temuan</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Telusuri daftar barang-barang yang telah ditemukan di area kampus. Silakan cek detail laporan untuk mencocokkan dengan barang Anda yang hilang.
            </p>
          </div>
          
          {/* Animated Background */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div 
              animate={{ 
                x: [0, 30, -30, 0],
                y: [0, -30, 30, 0],
                scale: [1, 1.1, 0.9, 1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -left-10 w-72 h-72 bg-secondary/15 rounded-full filter blur-3xl"
            ></motion.div>
            <motion.div 
              animate={{ 
                x: [0, -20, 20, 0],
                y: [0, 20, -20, 0],
                scale: [1, 0.95, 1.05, 1]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 right-10 w-72 h-72 bg-secondary-fixed-dim/20 rounded-full filter blur-3xl"
            ></motion.div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBWMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yMCAwTDIwIDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMScvPjxwYXRoIGQ9Ik0wIDIwaDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMScvPjwvc3ZnPg==')] opacity-45"></div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-surface/90 backdrop-blur-md border border-outline-variant/60 rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-lg flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1 relative flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/40 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary-fixed transition-all">
            <span className="material-symbols-outlined text-secondary mr-2 select-none">search</span>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" 
              id="search" 
              placeholder="Cari nama barang, lokasi, atau kategori..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex w-full md:w-auto gap-3 items-center">
            <div className="relative w-full md:w-56 bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/40 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary-fixed transition-all flex items-center">
              <select 
                className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface appearance-none focus:outline-none cursor-pointer pr-6" 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                <option value="Elektronik">Elektronik & Gadget</option>
                <option value="Dokumen">Dokumen & Kartu</option>
                <option value="Aksesoris">Aksesoris & Perhiasan</option>
                <option value="Kunci">Kunci</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <div className="pointer-events-none absolute right-4 flex items-center px-1 text-outline">
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campus Filter Pills */}
        <div className="mb-lg overflow-x-auto flex items-center gap-sm py-xs scrollbar-thin scrollbar-thumb-outline-variant">
          {campuses.map((campus) => {
            const isActive = campusFilter === campus.name;
            return (
              <button
                key={campus.name}
                onClick={() => setCampusFilter(campus.name)}
                className={`flex items-center gap-xs px-md py-sm rounded-full border text-body-sm font-label-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-secondary text-on-secondary border-secondary shadow-sm font-semibold'
                    : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                {campus.logo ? (
                  <img src={campus.logo} alt={campus.name} className="w-5 h-5 object-contain rounded-full" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">{campus.icon || 'school'}</span>
                )}
                <span>{campus.displayName}</span>
              </button>
            );
          })}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter mb-xl">
          {loading ? (
            <div className="col-span-full py-xl text-center text-on-surface-variant flex flex-col items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-secondary">progress_activity</span>
              <p>Memuat data...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-xl text-center text-on-surface-variant bg-surface rounded-xl border border-outline-variant">
              <span className="material-symbols-outlined text-4xl mb-4 mt-8 opacity-50">search_off</span>
              <p className="mb-8">Tidak ada barang yang cocok dengan pencarian Anda.</p>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <Link key={item.id} to={`/item-detail?id=${item.id}`} className="bg-surface rounded-2xl border border-outline-variant/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-secondary/20 transition-all duration-300 flex flex-col h-full group">
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
                  <div className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-[11px] font-semibold z-10 shadow-sm border border-secondary/10">
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
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-xl py-md">
            <nav aria-label="Pagination" className="flex items-center gap-2">
              <button 
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`w-10 h-10 rounded-lg font-label-md text-label-md flex items-center justify-center transition-colors ${
                      currentPage === page 
                        ? 'bg-secondary text-on-secondary' 
                        : 'text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </nav>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FoundItems;
