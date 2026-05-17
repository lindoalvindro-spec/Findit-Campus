import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkImage } from '../utils/nsfwCheck';
import { useToast } from '../components/Toast';

const CreateReport = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    report_type: 'lost',
    item_name: '',
    category: '',
    date: '',
    time: '',
    location: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.warning('Silakan masuk (login) terlebih dahulu untuk membuat/mengedit laporan.');
        navigate('/auth');
        return;
      }
      
      setUser(session.user);

      // If there is an editId, fetch the report data
      if (editId) {
        setIsEditMode(true);
        const { data, error } = await supabase
          .from('lost_items')
          .select('*')
          .eq('id', editId)
          .single();

        if (error) {
          toast.error('Gagal memuat data laporan: ' + error.message);
          navigate('/profile');
        } else if (data) {
          // Make sure the user owns this report
          if (data.user_id !== session.user.id) {
            toast.error('Anda tidak memiliki akses untuk mengedit laporan ini.');
            navigate('/profile');
            return;
          }
          
          setFormData({
            report_type: data.status === 'returned' || data.status === 'claimed' ? 'lost' : data.status, // Fallback if already resolved
            item_name: data.title || '',
            category: data.category || '',
            date: data.date_lost || '',
            time: data.time_lost || '',
            location: data.location || '',
            description: data.description || '',
            imageUrl: data.image_url || ''
          });
        }
      }
    };
    checkUserAndFetchData();
  }, [navigate, editId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('Ukuran gambar terlalu besar. Maksimal 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result;

        // NSFW Check
        setLoading(true);
        const { isSafe, reason } = await checkImage(dataUrl);
        setLoading(false);

        if (!isSafe) {
          toast.error(`Foto ditolak: ${reason}`, 'Konten Tidak Sesuai');
          e.target.value = ''; // Reset file input
          return;
        }

        setFormData({ ...formData, imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Sesi Anda telah berakhir, silakan login kembali.');
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    
    const payload = {
      title: formData.item_name,
      description: formData.description,
      location: formData.location,
      date_lost: formData.date,
      time_lost: formData.time,
      category: formData.category,
      status: formData.report_type,
      image_url: formData.imageUrl
    };

    let responseError;

    if (isEditMode) {
      // Update existing record
      const { error } = await supabase
        .from('lost_items')
        .update(payload)
        .eq('id', editId)
        .eq('user_id', user.id); // Extra safety check
      responseError = error;
    } else {
      // Insert new record
      payload.user_id = user.id;
      const { error } = await supabase
        .from('lost_items')
        .insert([payload]);
      responseError = error;
    }

    setLoading(false);
    
    if (responseError) {
      toast.error('Terjadi kesalahan: ' + responseError.message);
    } else {
      toast.success(isEditMode ? 'Laporan berhasil diperbarui!' : 'Laporan berhasil dibuat!');
      navigate(isEditMode ? '/profile' : '/lost-items');
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-xl">
        <div className="mb-lg">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            {isEditMode ? 'Edit Laporan' : 'Buat Laporan Baru'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
            {isEditMode ? 'Perbarui detail laporan agar lebih akurat.' : 'Berikan detail sejelas mungkin untuk membantu menemukan atau mengembalikan barang.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Form Section */}
          <div className="lg:col-span-8 bg-surface rounded-lg shadow-sm border border-outline-variant p-md md:p-lg">
            <form onSubmit={handleSubmit} className="space-y-lg">
              {/* Report Type */}
              <fieldset>
                <legend className="font-label-md text-label-md text-on-surface mb-sm block">Jenis Laporan</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <label className="relative flex cursor-pointer rounded-lg border bg-surface p-md shadow-sm border-outline-variant hover:bg-surface-container-low transition-colors has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20">
                    <input 
                      checked={formData.report_type === 'lost'} 
                      onChange={handleChange}
                      className="peer sr-only" 
                      name="report_type" 
                      type="radio" 
                      value="lost" 
                    />
                    <div className="flex items-center gap-md">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-on-error-container">
                        <span className="material-symbols-outlined">search_off</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Barang Hilang</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Saya kehilangan barang saya</p>
                      </div>
                    </div>
                  </label>
                  
                  <label className="relative flex cursor-pointer rounded-lg border bg-surface p-md shadow-sm border-outline-variant hover:bg-surface-container-low transition-colors has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:checked]:bg-primary-fixed/20">
                    <input 
                      checked={formData.report_type === 'found'}
                      onChange={handleChange}
                      className="peer sr-only" 
                      name="report_type" 
                      type="radio" 
                      value="found" 
                    />
                    <div className="flex items-center gap-md">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface">Barang Ditemukan</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Saya menemukan barang orang lain</p>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Item Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor="item_name">Nama Barang <span className="text-error">*</span></label>
                  <input 
                    value={formData.item_name}
                    onChange={handleChange}
                    className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                    id="item_name" 
                    name="item_name" 
                    placeholder="Contoh: Dompet Kulit Hitam, Kunci Motor Honda" 
                    required 
                    type="text" 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor="category">Kategori <span className="text-error">*</span></label>
                  <div className="relative">
                    <select 
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full appearance-none rounded-DEFAULT border border-outline-variant bg-surface px-md py-sm pr-10 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                      id="category" 
                      name="category" 
                      required
                    >
                      <option disabled value="">Pilih Kategori</option>
                      <option value="Elektronik & Gadget">Elektronik & Gadget</option>
                      <option value="Dokumen & Kartu">Dokumen & Kartu</option>
                      <option value="Aksesoris & Perhiasan">Aksesoris & Perhiasan</option>
                      <option value="Kunci">Kunci</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-sm text-on-surface-variant">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor="date">Tanggal Kejadian <span className="text-error">*</span></label>
                  <input 
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                    id="date" 
                    name="date" 
                    required 
                    type="date" 
                  />
                </div>
                
                <div>
                  <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor="time">Waktu (Perkiraan) <span className="text-error">*</span></label>
                  <input 
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                    id="time" 
                    name="time" 
                    required 
                    type="time" 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor="location">Lokasi (Perkiraan) <span className="text-error">*</span></label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm text-on-surface-variant">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <input 
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full rounded-DEFAULT border border-outline-variant bg-surface pl-10 pr-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                      id="location" 
                      name="location" 
                      placeholder="Contoh: Gedung Fakultas Teknik Lantai 2, Kantin Utama" 
                      required 
                      type="text" 
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface mb-xs block" htmlFor="description">Deskripsi Detail <span className="text-error">*</span></label>
                  <textarea 
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full rounded-DEFAULT border border-outline-variant bg-surface px-md py-sm font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                    id="description" 
                    name="description" 
                    placeholder="Sebutkan ciri-ciri khusus, merk, warna, atau isi jika ada..." 
                    required 
                    rows="4"
                  ></textarea>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Maksimal 500 karakter.</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="font-label-md text-label-md text-on-surface mb-xs block">Foto Barang (Opsional)</label>
                  {formData.imageUrl ? (
                    <div className="relative mt-4 w-full max-w-md mx-auto h-48 md:h-64 rounded-lg overflow-hidden border border-outline-variant shadow-sm bg-surface-variant flex items-center justify-center">
                      <img src={formData.imageUrl} alt="Pratinjau" className="w-full h-full object-contain p-2" />
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="absolute top-2 right-2 bg-error text-on-error p-1 rounded-full shadow-md hover:bg-error/90 transition-colors flex items-center justify-center"
                        title="Hapus foto"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-xs flex justify-center rounded-lg border-2 border-dashed border-outline-variant px-lg py-xl hover:bg-surface-container-low hover:border-primary transition-all cursor-pointer bg-surface group relative overflow-hidden">
                      <input accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="file-upload" name="file-upload" type="file" onChange={handleImageChange} />
                      <div className="text-center group-hover:text-primary">
                        <span className="material-symbols-outlined text-4xl text-outline mb-sm group-hover:text-primary transition-colors">cloud_upload</span>
                        <div className="mt-sm flex justify-center font-body-md text-body-md text-on-surface-variant">
                          <span className="relative rounded-md font-label-md text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-on-primary-fixed-variant">
                            <span>Unggah file</span>
                          </span>
                          <p className="pl-1">atau tarik dan lepas kesini</p>
                        </div>
                        <p className="font-body-sm text-body-sm text-outline mt-xs">PNG, JPG, GIF hingga 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-md flex items-center justify-end border-t border-outline-variant mt-lg">
                <button 
                  onClick={() => navigate(isEditMode ? '/profile' : '/')} 
                  className="px-md py-sm rounded-DEFAULT font-label-md text-label-md text-primary hover:bg-surface-container-high transition-colors mr-sm" 
                  type="button"
                >
                  Batal
                </button>
                <button 
                  disabled={loading}
                  className="flex items-center justify-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-DEFAULT font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary active:scale-95 disabled:opacity-50" 
                  type="submit"
                >
                  <span className="material-symbols-outlined text-sm">{loading ? 'progress_activity' : 'send'}</span>
                  {loading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Kirim Laporan')}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar / Guidelines */}
          <div className="lg:col-span-4 space-y-md">
            <div className="bg-surface-container-low rounded-lg p-lg border border-outline-variant shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-sm mb-md pb-sm border-b border-outline-variant">
                <span className="material-symbols-outlined text-primary">lightbulb</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Panduan Pelaporan</h2>
              </div>
              <ul className="space-y-md">
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-outline mt-1 text-base">check_circle</span>
                  <div>
                    <h3 className="font-label-md text-label-md text-on-surface">Detail is Kunci</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Semakin detail deskripsi yang Anda berikan, semakin mudah bagi orang lain untuk mengidentifikasi barang tersebut.</p>
                  </div>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-outline mt-1 text-base">photo_camera</span>
                  <div>
                    <h3 className="font-label-md text-label-md text-on-surface">Gunakan Foto Asli</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Jika ada, lampirkan foto barang asli atau foto referensi yang sangat mirip untuk menghindari kebingungan.</p>
                  </div>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-outline mt-1 text-base">security</span>
                  <div>
                    <h3 className="font-label-md text-label-md text-on-surface">Lindungi Privasi</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Jangan mengunggah foto kartu identitas (KTP, KTM) secara utuh yang menampakkan data sensitif.</p>
                  </div>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-outline mt-1 text-base">update</span>
                  <div>
                    <h3 className="font-label-md text-label-md text-on-surface">Perbarui Status</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Jika barang sudah ditemukan atau dikembalikan, segera perbarui status laporan Anda di halaman "My Reports".</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-surface rounded-lg p-md border border-outline-variant flex items-start gap-md">
              <div className="bg-surface-container-high p-sm rounded-full text-primary">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface">Butuh Bantuan?</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs mb-sm">Jika Anda kesulitan menggunakan form ini, hubungi pusat layanan kami.</p>
                <a className="font-label-sm text-label-sm text-primary hover:underline" href="#">Hubungi Bantuan</a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateReport;
