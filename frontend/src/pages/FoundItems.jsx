import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const FoundItems = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;
  
  // Perbarui parameter URL ketika searchQuery berubah
  useEffect(() => {
    const params = {};
    if (searchQuery) params.q = searchQuery;
    setSearchParams(params, { replace: true });
  }, [searchQuery, setSearchParams]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .eq('status', 'found')
        .order('created_at', { ascending: false });
      
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
    
    return matchQuery && matchCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        {/* Page Header */}
        <div className="mb-lg relative rounded-3xl overflow-hidden bg-secondary-fixed-dim/20 border border-secondary/10 p-8 md:p-12 shadow-sm">
          <div className="relative z-10">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-2">Daftar Barang Ditemukan</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Telusuri daftar barang-barang yang telah ditemukan di area kampus. Gunakan fitur pencarian dan filter untuk mempermudah pencarian barang Anda.</p>
          </div>
          
          {/* Animated Background */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-64 md:w-96 h-64 md:h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-[-50%] right-[10%] w-64 md:w-96 h-64 md:h-96 bg-primary-container/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
            
            {/* Subtle Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBWMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yMCAwTDIwIDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0wIDIwaDIwIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-40"></div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm mb-xl flex flex-col md:flex-row gap-md items-end md:items-center">
          <div className="w-full md:flex-1 relative">
            <label className="sr-only" htmlFor="search">Cari barang...</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input 
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-surface transition-all duration-200 text-body-sm font-body-sm" 
              id="search" 
              placeholder="Cari nama barang, lokasi, atau kategori..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-md">
            <div className="relative w-full sm:w-auto">
              <select 
                className="w-full appearance-none bg-surface border border-outline-variant rounded-lg pl-3 pr-10 py-2 text-body-sm font-body-sm text-on-surface focus:ring-2 focus:ring-secondary focus:border-secondary transition-all duration-200" 
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-outline">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
            <button className="w-full sm:w-auto bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-label-md text-label-md font-medium hover:bg-surface-variant transition-colors duration-200 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">tune</span> Filter
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter mb-xl">
          {loading ? (
            <div className="col-span-full py-xl text-center text-on-surface-variant flex flex-col items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
              <p>Memuat data...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-xl text-center text-on-surface-variant bg-surface rounded-xl border border-outline-variant">
              <span className="material-symbols-outlined text-4xl mb-4 mt-8 opacity-50">search_off</span>
              <p className="mb-8">Tidak ada barang yang cocok dengan pencarian Anda.</p>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <Link key={item.id} to={`/item-detail?id=${item.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col group">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-variant flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="material-symbols-outlined text-[64px] text-outline-variant opacity-50">inventory_2</span>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-medium bg-secondary-container text-on-secondary-container border border-secondary/20">
                      Ditemukan
                    </span>
                  </div>
                </div>
                <div className="p-md flex-grow flex flex-col">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs line-clamp-1 group-hover:text-secondary transition-colors">{item.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-md line-clamp-2">{item.description || 'Tidak ada deskripsi'}</p>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center text-on-surface-variant font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-[18px] mr-2">location_on</span>
                      <span className="truncate">{item.location || 'Lokasi tidak diketahui'}</span>
                    </div>
                    <div className="flex items-center text-on-surface-variant font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-[18px] mr-2">calendar_today</span>
                      <span>{item.date_lost ? new Date(item.date_lost).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
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
