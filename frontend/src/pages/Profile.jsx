import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Dashboard States
  const [activeTab, setActiveTab] = useState('laporan');
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    const initProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Silakan login terlebih dahulu untuk mengakses profil.");
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      setEmail(session.user.email);

      // Fetch profile details
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setNim(profile.nim || '');
        setAvatarUrl(profile.avatar_url || '');
      }

      setLoading(false);
      fetchMyReports(session.user.id);
    };

    initProfile();
  }, [navigate]);

  const fetchMyReports = async (userId) => {
    setLoadingReports(true);
    const { data, error } = await supabase
      .from('lost_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyReports(data);
    }
    setLoadingReports(false);
  };

  // Profile Edit Handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase
      .from('users')
      .update({ full_name: fullName, nim: nim, avatar_url: avatarUrl })
      .eq('id', user.id);

    setSavingProfile(false);
    if (error) {
      alert("Gagal memperbarui profil: " + error.message);
    } else {
      alert("Profil berhasil diperbarui!");
      setIsEditingProfile(false);
      window.location.reload(); // Refresh navbar avatar
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // CRUD Handlers for Reports
  const handleDeleteReport = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
      const { error } = await supabase.from('lost_items').delete().eq('id', id);
      if (error) {
        alert("Gagal menghapus laporan: " + error.message);
      } else {
        setMyReports(myReports.filter(report => report.id !== id));
      }
    }
  };

  const handleResolveReport = async (id, currentStatus) => {
    const confirmMessage = currentStatus === 'lost' 
      ? "Tandai barang ini sudah ditemukan/selesai?" 
      : "Tandai barang temuan ini sudah dikembalikan?";
      
    if (window.confirm(confirmMessage)) {
      const { error } = await supabase
        .from('lost_items')
        .update({ status: 'returned' })
        .eq('id', id);
        
      if (error) {
        alert("Gagal memperbarui status: " + error.message);
      } else {
        setMyReports(myReports.map(report => 
          report.id === id ? { ...report, status: 'returned' } : report
        ));
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2">progress_activity</span>
            <p className="text-on-surface-variant font-label-md">Memuat profil...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow w-full px-margin-mobile md:px-margin-desktop max-w-[1000px] mx-auto py-xl space-y-lg">
        
        {/* Profile Header Card */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-md relative">
          <div className="flex items-center gap-lg">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-surface-container-high bg-surface-variant flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[48px]">person</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">{fullName || 'Pengguna Anonim'}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-1">NIM: {nim || '-'}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{email}</p>
            </div>
          </div>
          
          <div className="flex gap-sm self-start md:self-auto w-full md:w-auto mt-4 md:mt-0">
            <button 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex-1 md:flex-none flex items-center justify-center gap-xs border border-outline text-on-surface px-md py-sm rounded-lg font-label-md hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {isEditingProfile ? 'Tutup Edit' : 'Edit Profil'}
            </button>
            <button 
              onClick={handleLogout}
              className="md:hidden flex items-center justify-center gap-xs border border-error/50 text-error px-md py-sm rounded-lg font-label-md hover:bg-error/5 transition-colors"
              title="Keluar"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </div>

        {/* Edit Profile Form (Collapsible) */}
        {isEditingProfile && (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md pb-sm border-b border-outline-variant">Edit Informasi Profil</h2>
            <form onSubmit={handleSaveProfile} className="space-y-md">
              <div className="flex flex-col md:flex-row gap-lg">
                <div className="flex flex-col items-center gap-sm">
                  <div className="relative group w-32 h-32">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container-high flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Foto Profil" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[48px] text-outline">person</span>
                      )}
                    </div>
                    <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <span className="material-symbols-outlined">photo_camera</span>
                    </label>
                    <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-center max-w-[120px]">Klik foto untuk ubah (Max 2MB)</p>
                </div>
                
                <div className="flex-1 space-y-md">
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface mb-xs block">Nama Lengkap</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-md border border-outline-variant bg-surface px-md py-sm font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" required />
                  </div>
                  <div>
                    <label className="font-label-sm text-label-sm text-on-surface mb-xs block">NIM</label>
                    <input value={nim} onChange={(e) => setNim(e.target.value)} className="w-full rounded-md border border-outline-variant bg-surface px-md py-sm font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" required />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant">
                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-md py-sm rounded-md font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">Batal</button>
                <button type="submit" disabled={savingProfile} className="flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-md font-label-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-sm">{savingProfile ? 'progress_activity' : 'save'}</span>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dashboard Tabs & Content */}
        {!isEditingProfile && (
          <div className="space-y-md">
            {/* Tabs */}
            <div className="flex gap-lg border-b border-outline-variant mb-md px-sm">
              <button 
                onClick={() => setActiveTab('laporan')}
                className={`pb-sm font-label-md transition-colors relative ${activeTab === 'laporan' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Laporan Saya
                {activeTab === 'laporan' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('aktivitas')}
                className={`pb-sm font-label-md transition-colors relative ${activeTab === 'aktivitas' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Aktivitas
                {activeTab === 'aktivitas' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"></div>}
              </button>
            </div>

            {/* Tab Content: Laporan Saya */}
            {activeTab === 'laporan' && (
              <div className="space-y-md">
                {loadingReports ? (
                  <div className="py-xl text-center text-on-surface-variant flex flex-col items-center">
                    <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
                    <p>Memuat laporan...</p>
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-[64px] text-outline opacity-50 mb-4">post_add</span>
                    <h3 className="font-headline-sm text-on-surface mb-2">Belum Ada Laporan</h3>
                    <p className="text-on-surface-variant mb-6 w-full px-4">Anda belum membuat laporan kehilangan atau penemuan barang apa pun.</p>
                    <Link to="/create-report" className="bg-primary text-on-primary px-lg py-sm rounded-full font-label-md hover:bg-primary/90 transition-colors">Buat Laporan Pertama</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReports.map((report) => (
                      <div key={report.id} className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col sm:flex-row">
                        {/* Image Left */}
                        <div className="w-full sm:w-48 h-48 sm:h-auto bg-surface-container-high relative flex-shrink-0">
                          {report.image_url ? (
                            <img src={report.image_url} alt={report.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline opacity-50">
                              <span className="material-symbols-outlined text-[64px]">image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Content Right */}
                        <div className="p-md flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <Link to={`/item-detail?id=${report.id}`} className="font-headline-sm text-on-surface hover:text-primary transition-colors line-clamp-1">{report.title}</Link>
                              {report.status === 'returned' ? (
                                <span className="inline-flex flex-shrink-0 bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full font-label-sm border border-primary/20">Selesai</span>
                              ) : (
                                <span className={`inline-flex flex-shrink-0 px-2.5 py-0.5 rounded-full font-label-sm border ${report.status === 'lost' ? 'bg-error-container text-on-error-container border-error/20' : 'bg-secondary-container text-on-secondary-container border-secondary/20'}`}>
                                  {report.status === 'lost' ? 'Hilang' : 'Ditemukan'}
                                </span>
                              )}
                            </div>
                            <p className="font-body-sm text-on-surface-variant line-clamp-2 mb-3">
                              {report.description || 'Tidak ada deskripsi.'}
                            </p>
                            <div className="flex items-center gap-xs text-outline font-body-sm mb-4">
                              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                              {new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-sm pt-sm border-t border-outline-variant">
                            <div>
                              {report.status !== 'returned' && (
                                <button 
                                  onClick={() => handleResolveReport(report.id, report.status)}
                                  className="bg-primary text-on-primary px-sm py-1.5 rounded-md font-label-sm flex items-center gap-1 hover:bg-primary/90 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  {report.status === 'lost' ? 'Tandai Selesai' : 'Sudah Dikembalikan'}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-xs ml-auto">
                              <Link 
                                to={`/create-report?edit=${report.id}`} // Placeholder if they want to build real edit later
                                className="text-on-surface-variant hover:text-primary p-1.5 rounded-md hover:bg-surface-container flex items-center gap-1 transition-colors"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                <span className="font-label-sm">Edit</span>
                              </Link>
                              <button 
                                onClick={() => handleDeleteReport(report.id)}
                                className="text-error/80 hover:text-error p-1.5 rounded-md hover:bg-error/10 flex items-center gap-1 transition-colors"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                <span className="font-label-sm">Hapus</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Aktivitas */}
            {activeTab === 'aktivitas' && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-[64px] text-outline opacity-50 mb-4">history</span>
                <h3 className="font-headline-sm text-on-surface mb-2">Belum Ada Aktivitas</h3>
                <p className="text-on-surface-variant w-full px-4">Fitur riwayat aktivitas akan segera hadir di pembaruan selanjutnya.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
