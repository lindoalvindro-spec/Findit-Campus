import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ItemDetail = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('lost_items')
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setItem(data);
      } else {
        console.error("Error fetching item details:", error);
      }
      setLoading(false);
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-xl flex items-center justify-center">
          <div className="flex flex-col items-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
            <p>Memuat detail barang...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-xl flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">search_off</span>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Barang Tidak Ditemukan</h2>
          <p className="text-on-surface-variant mb-6">Barang yang Anda cari tidak ada atau mungkin sudah dihapus.</p>
          <Link to="/lost-items" className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md hover:bg-primary/90 transition-colors">
            Kembali ke Daftar
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        {/* Back Navigation */}
        <div className="mb-lg">
          <Link className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors duration-200" to="/lost-items">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="font-label-md text-label-md">Kembali ke Daftar</span>
          </Link>
        </div>

        {/* Detail Layout: Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Images */}
          <div className="lg:col-span-7 space-y-md">
            {/* Main Image Card */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden aspect-[4/3] flex items-center justify-center relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[120px] text-outline-variant opacity-20">image_not_supported</span>
                  <div className="absolute bottom-4 right-4 bg-surface/80 backdrop-blur-sm px-3 py-1 rounded-md text-xs text-on-surface-variant border border-outline-variant/50">
                    Gambar belum diunggah
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-5 space-y-xl">
            {/* Header & Status */}
            <div className="space-y-sm border-b border-outline-variant pb-lg">
              <div className="flex items-center gap-sm mb-xs">
                <span className={`font-label-md text-label-md px-md py-xs rounded-full ${item.status === 'lost' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                  {item.status === 'lost' ? 'Hilang' : 'Ditemukan'}
                </span>
                <span className="text-outline font-body-sm text-body-sm">
                  {new Date(item.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface">{item.title}</h1>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md bg-surface-container-low p-md rounded-lg">
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-outline">category</span>
                <div>
                  <p className="font-label-sm text-label-sm text-outline">Kategori</p>
                  <p className="font-body-md text-body-md text-on-surface">{item.category || 'Lainnya'}</p>
                </div>
              </div>
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-outline">schedule</span>
                <div>
                  <p className="font-label-sm text-label-sm text-outline">Waktu Perkiraan</p>
                  <p className="font-body-md text-body-md text-on-surface">{item.time_lost || 'Tidak diketahui'}</p>
                </div>
              </div>
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-outline">location_on</span>
                <div>
                  <p className="font-label-sm text-label-sm text-outline">Lokasi Terakhir</p>
                  <p className="font-body-md text-body-md text-on-surface">{item.location || 'Tidak diketahui'}</p>
                </div>
              </div>
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-outline">calendar_month</span>
                <div>
                  <p className="font-label-sm text-label-sm text-outline">Tanggal Kejadian</p>
                  <p className="font-body-md text-body-md text-on-surface">{item.date_lost ? new Date(item.date_lost).toLocaleDateString('id-ID') : 'Tidak diketahui'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-md">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Deskripsi Barang</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {item.description || 'Tidak ada deskripsi yang diberikan untuk barang ini.'}
              </p>
            </div>

            {/* Reporter Card */}
            <div className="bg-surface border border-outline-variant rounded-xl p-lg shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <h3 className="font-label-md text-label-md text-outline mb-md uppercase tracking-wide">Informasi Pelapor</h3>
              <div className="flex items-center justify-between flex-wrap gap-md">
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-sm shadow-sm overflow-hidden border border-outline-variant/30">
                    {item.users?.avatar_url ? (
                      <img src={item.users.avatar_url} alt={item.users.full_name || 'Pelapor'} className="w-full h-full object-cover" />
                    ) : (
                      item.users?.full_name ? item.users.full_name.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <div>
                    <p className="font-headline-sm text-headline-sm text-on-surface">{item.users?.full_name || 'Anonim'}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Pelapor</p>
                  </div>
                </div>
                <Link 
                  to={item.users?.id ? `/messages?userId=${item.users.id}&itemId=${item.id}` : '#'}
                  className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-md text-label-md flex items-center gap-sm hover:bg-on-primary-fixed-variant transition-colors shadow-sm w-full sm:w-auto justify-center"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                  Hubungi Pelapor
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ItemDetail;
