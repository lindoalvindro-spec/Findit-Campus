import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiClient } from '../services/apiClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkImage } from '../utils/nsfwCheck';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

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
    campus: 'UIN Suska Riau',
    location: '',
    description: '',
    imageUrl: ''
  });

  // Progress calculation
  const progress = useMemo(() => {
    const fields = ['item_name', 'category', 'date', 'time', 'location', 'description'];
    const filled = fields.filter(f => formData[f] && formData[f].trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const token = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      if (!token || !localUser) {
        toast.warning('Silakan masuk (login) terlebih dahulu untuk membuat/mengedit laporan.');
        navigate('/auth');
        return;
      }
      
      let loggedInUser;
      try {
        loggedInUser = JSON.parse(localUser);
        setUser(loggedInUser);
      } catch (e) {
        toast.warning('Silakan masuk (login) terlebih dahulu untuk membuat/mengedit laporan.');
        navigate('/auth');
        return;
      }

      // If there is an editId, fetch the report data
      if (editId) {
        setIsEditMode(true);
        const { data, error } = await apiClient.get(`/api/items/${editId}`);

        if (error) {
          toast.error('Gagal memuat data laporan: ' + error.message);
          navigate('/profile');
        } else if (data) {
          // Make sure the user owns this report
          if (data.user_id !== loggedInUser.id) {
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
            campus: data.campus || 'UIN Suska Riau',
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
      image_url: formData.imageUrl,
      campus: formData.campus
    };

    let responseError;

    if (isEditMode) {
      // Update existing record
      const { error } = await apiClient.put(`/api/items/${editId}`, payload);
      responseError = error;
    } else {
      // Insert new record
      const { error } = await apiClient.post('/api/items', payload);
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

  // Stagger animation variants
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  // Shared input class
  const inputClass = "w-full rounded-xl border border-outline-variant/70 bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-outline placeholder:text-outline/60";

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
            {isEditMode ? 'Edit Laporan' : 'Buat Laporan Baru'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            {isEditMode ? 'Perbarui detail laporan agar lebih akurat.' : 'Berikan detail sejelas mungkin untuk membantu menemukan atau mengembalikan barang.'}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
          style={{ transformOrigin: 'left' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Kelengkapan Form</span>
            <motion.span
              key={progress}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-label-md text-label-md font-bold ${progress === 100 ? 'text-secondary' : 'text-primary'}`}
            >
              {progress}%
            </motion.span>
          </div>
          <div className="w-full h-2 bg-surface-container-high/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full transition-colors duration-300 ${progress === 100 ? 'bg-gradient-to-r from-secondary to-secondary-container' : 'bg-gradient-to-r from-primary to-surface-tint'}`}
            />
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-8 bg-surface rounded-2xl shadow-sm border border-outline-variant/60 p-6 md:p-8"
          >
            <form onSubmit={handleSubmit}>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-7"
              >
                {/* ====== Section 1: Jenis Laporan ====== */}
                <motion.fieldset variants={itemVariants}>
                  <legend className="font-label-md text-label-md text-on-surface mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px]">category</span>
                    </span>
                    Jenis Laporan
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Lost */}
                    <motion.label
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex cursor-pointer rounded-xl border-2 bg-surface p-4 transition-all duration-200 ${
                        formData.report_type === 'lost'
                          ? 'border-primary ring-1 ring-primary/30 bg-primary-fixed/15 shadow-md'
                          : 'border-outline-variant/60 hover:border-outline hover:bg-surface-container-low shadow-sm'
                      }`}
                    >
                      <input 
                        checked={formData.report_type === 'lost'} 
                        onChange={handleChange}
                        className="peer sr-only" 
                        name="report_type" 
                        type="radio" 
                        value="lost" 
                      />
                      <div className="flex items-center gap-3 w-full">
                        <motion.div
                          animate={formData.report_type === 'lost' ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                            formData.report_type === 'lost'
                              ? 'bg-error text-on-error shadow-sm'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          <span className="material-symbols-outlined">search_off</span>
                        </motion.div>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface font-semibold">Barang Hilang</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">Saya kehilangan barang saya</p>
                        </div>
                        {formData.report_type === 'lost' && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto material-symbols-outlined text-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </motion.span>
                        )}
                      </div>
                    </motion.label>
                    
                    {/* Found */}
                    <motion.label
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex cursor-pointer rounded-xl border-2 bg-surface p-4 transition-all duration-200 ${
                        formData.report_type === 'found'
                          ? 'border-secondary ring-1 ring-secondary/30 bg-secondary-fixed/15 shadow-md'
                          : 'border-outline-variant/60 hover:border-outline hover:bg-surface-container-low shadow-sm'
                      }`}
                    >
                      <input 
                        checked={formData.report_type === 'found'}
                        onChange={handleChange}
                        className="peer sr-only" 
                        name="report_type" 
                        type="radio" 
                        value="found" 
                      />
                      <div className="flex items-center gap-3 w-full">
                        <motion.div
                          animate={formData.report_type === 'found' ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                            formData.report_type === 'found'
                              ? 'bg-secondary text-on-secondary shadow-sm'
                              : 'bg-secondary-container text-on-secondary-container'
                          }`}
                        >
                          <span className="material-symbols-outlined">inventory_2</span>
                        </motion.div>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface font-semibold">Barang Ditemukan</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">Saya menemukan barang orang lain</p>
                        </div>
                        {formData.report_type === 'found' && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto material-symbols-outlined text-secondary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </motion.span>
                        )}
                      </div>
                    </motion.label>
                  </div>
                </motion.fieldset>

                {/* Divider */}
                <motion.div variants={itemVariants} className="border-t border-outline-variant/40" />

                {/* ====== Section 2: Info Barang ====== */}
                <motion.div variants={itemVariants}>
                  <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                    </span>
                    Informasi Barang
                  </h3>
                  <div className="space-y-4">
                    {/* Item Name */}
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block" htmlFor="item_name">Nama Barang <span className="text-error">*</span></label>
                      <input 
                        value={formData.item_name}
                        onChange={handleChange}
                        className={inputClass}
                        id="item_name" 
                        name="item_name" 
                        placeholder="Contoh: Dompet Kulit Hitam, Kunci Motor Honda" 
                        required 
                        type="text" 
                      />
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block" htmlFor="category">Kategori <span className="text-error">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.category}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none pr-10`}
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[20px]">expand_more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div variants={itemVariants} className="border-t border-outline-variant/40" />

                {/* ====== Section 3: Detail Kejadian ====== */}
                <motion.div variants={itemVariants}>
                  <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                    </span>
                    Detail Kejadian
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block" htmlFor="date">Tanggal <span className="text-error">*</span></label>
                      <input 
                        value={formData.date}
                        onChange={handleChange}
                        className={inputClass}
                        id="date" 
                        name="date" 
                        required 
                        type="date" 
                      />
                    </div>
                    
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block">Waktu (Perkiraan) <span className="text-error">*</span></label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <select
                            value={formData.time ? formData.time.split(':')[0] : ''}
                            onChange={(e) => {
                              const mins = formData.time ? formData.time.split(':')[1] || '00' : '00';
                              setFormData({ ...formData, time: `${e.target.value}:${mins}` });
                            }}
                            className={`${inputClass} appearance-none pr-8`}
                            required
                          >
                            <option disabled value="">Jam</option>
                            {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                          </div>
                        </div>
                        <span className="text-on-surface font-bold text-lg select-none">:</span>
                        <div className="relative flex-1">
                          <select
                            value={formData.time ? formData.time.split(':')[1] || '' : ''}
                            onChange={(e) => {
                              const hrs = formData.time ? formData.time.split(':')[0] || '00' : '00';
                              setFormData({ ...formData, time: `${hrs}:${e.target.value}` });
                            }}
                            className={`${inputClass} appearance-none pr-8`}
                            required
                          >
                            <option disabled value="">Menit</option>
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div variants={itemVariants} className="border-t border-outline-variant/40" />

                {/* ====== Section 4: Lokasi ====== */}
                <motion.div variants={itemVariants}>
                  <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                    </span>
                    Lokasi
                  </h3>
                  <div className="space-y-4">
                    {/* Campus */}
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block" htmlFor="campus">Pilih Kampus <span className="text-error">*</span></label>
                      <div className="relative">
                        <select 
                          value={formData.campus}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none pr-10`}
                          id="campus" 
                          name="campus" 
                          required
                        >
                          <option disabled value="">Pilih Kampus</option>
                          <option value="UIN Suska Riau">UIN Suska Riau</option>
                          <option value="Universitas Riau (UNRI)">Universitas Riau (UNRI)</option>
                          <option value="Universitas Islam Riau (UIR)">Universitas Islam Riau (UIR)</option>
                          <option value="Universitas Muhammadiyah Riau (UMRI)">Universitas Muhammadiyah Riau (UMRI)</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[20px]">expand_more</span>
                        </div>
                      </div>
                    </div>

                    {/* Location detail */}
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block" htmlFor="location">Lokasi Spesifik <span className="text-error">*</span></label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline">
                          <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                        </div>
                        <input 
                          value={formData.location}
                          onChange={handleChange}
                          className={`${inputClass} pl-11`}
                          id="location" 
                          name="location" 
                          placeholder="Contoh: Gedung Fakultas Teknik Lantai 2, Kantin Utama" 
                          required 
                          type="text" 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div variants={itemVariants} className="border-t border-outline-variant/40" />

                {/* ====== Section 5: Deskripsi & Foto ====== */}
                <motion.div variants={itemVariants}>
                  <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px]">description</span>
                    </span>
                    Deskripsi & Foto
                  </h3>
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block" htmlFor="description">Deskripsi Detail <span className="text-error">*</span></label>
                      <textarea 
                        value={formData.description}
                        onChange={handleChange}
                        className={`${inputClass} resize-y`}
                        id="description" 
                        name="description" 
                        placeholder="Sebutkan ciri-ciri khusus, merk, warna, atau isi jika ada..." 
                        required 
                        rows="4"
                      ></textarea>
                      <div className="flex justify-between mt-1.5">
                        <p className="font-body-sm text-body-sm text-outline/70">Semakin detail, semakin mudah ditemukan.</p>
                        <p className={`font-label-sm text-label-sm ${formData.description.length > 450 ? 'text-error' : 'text-outline/70'}`}>
                          {formData.description.length}/500
                        </p>
                      </div>
                    </div>
                    
                    {/* Photo Upload */}
                    <div>
                      <label className="font-label-sm text-label-sm text-on-surface-variant mb-1.5 block">Foto Barang (Opsional)</label>
                      <AnimatePresence mode="wait">
                        {formData.imageUrl ? (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md mx-auto h-48 md:h-64 rounded-xl overflow-hidden border border-outline-variant/60 shadow-sm bg-surface-container-lowest flex items-center justify-center"
                          >
                            <img src={formData.imageUrl} alt="Pratinjau" className="w-full h-full object-contain p-2" />
                            <motion.button 
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              type="button" 
                              onClick={() => setFormData({ ...formData, imageUrl: '' })}
                              className="absolute top-2.5 right-2.5 bg-error text-on-error p-1.5 rounded-full shadow-md hover:bg-error/90 transition-colors flex items-center justify-center"
                              title="Hapus foto"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </motion.button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            whileHover={{ borderColor: 'var(--color-primary, #00288e)' }}
                            className="flex justify-center rounded-xl border-2 border-dashed border-outline-variant/60 px-6 py-10 hover:bg-primary/[0.02] transition-all cursor-pointer bg-surface-container-lowest group relative overflow-hidden"
                          >
                            <input accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="file-upload" name="file-upload" type="file" onChange={handleImageChange} />
                            <div className="text-center">
                              <motion.span
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="material-symbols-outlined text-4xl text-outline/50 mb-2 group-hover:text-primary transition-colors inline-block"
                              >
                                cloud_upload
                              </motion.span>
                              <div className="mt-2 flex justify-center font-body-md text-body-md text-on-surface-variant">
                                <span className="font-label-md text-primary">Unggah file</span>
                                <p className="pl-1.5">atau tarik dan lepas kesini</p>
                              </div>
                              <p className="font-body-sm text-body-sm text-outline/60 mt-1">PNG, JPG, GIF hingga 5MB</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

                {/* ====== Submit ====== */}
                <motion.div variants={itemVariants} className="pt-5 flex items-center justify-end border-t border-outline-variant/40">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(isEditMode ? '/profile' : '/')} 
                    className="px-5 py-2.5 rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all mr-3 cursor-pointer" 
                    type="button"
                  >
                    Batal
                  </motion.button>
                  <motion.button 
                    disabled={loading}
                    whileHover={loading ? {} : { scale: 1.03, y: -1 }}
                    whileTap={loading ? {} : { scale: 0.97 }}
                    className={`flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl font-label-md text-label-md transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.report_type === 'found'
                        ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                        : 'bg-primary text-on-primary hover:bg-primary/90'
                    }`}
                    type="submit"
                  >
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="material-symbols-outlined text-[18px]"
                      >
                        progress_activity
                      </motion.span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    )}
                    {loading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Kirim Laporan')}
                  </motion.button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>

          {/* Sidebar / Guidelines */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="lg:col-span-4 space-y-4"
          >
            <div className="bg-surface-container-low/80 rounded-2xl p-6 border border-outline-variant/50 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-outline-variant/40">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Panduan Pelaporan</h2>
              </div>
              <ul className="space-y-5">
                {[
                  { icon: 'check_circle', title: 'Detail is Kunci', desc: 'Semakin detail deskripsi yang Anda berikan, semakin mudah bagi orang lain untuk mengidentifikasi barang tersebut.' },
                  { icon: 'photo_camera', title: 'Gunakan Foto Asli', desc: 'Jika ada, lampirkan foto barang asli atau foto referensi yang sangat mirip untuk menghindari kebingungan.' },
                  { icon: 'security', title: 'Lindungi Privasi', desc: 'Jangan mengunggah foto kartu identitas (KTP, KTM) secara utuh yang menampakkan data sensitif.' },
                  { icon: 'update', title: 'Perbarui Status', desc: 'Jika barang sudah ditemukan atau dikembalikan, segera perbarui status laporan Anda di halaman "Dasbor Laporan".' }
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-surface-container-high/80 flex items-center justify-center text-outline mt-0.5 flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface font-semibold">{item.title}</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-surface rounded-2xl p-5 border border-outline-variant/50 flex items-start gap-3.5 shadow-sm"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">support_agent</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface font-semibold">Butuh Bantuan?</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-2 leading-relaxed">Jika Anda kesulitan menggunakan form ini, hubungi pusat layanan kami.</p>
                <a className="font-label-sm text-label-sm text-primary animated-underline inline-block" href="#">Hubungi Bantuan</a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateReport;
