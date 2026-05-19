import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Auth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nim, setNim] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg("Gagal terhubung ke database. Pastikan VITE_SUPABASE_URL di file .env sudah benar.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data.user) {
           const { error: insertError } = await supabase
             .from('users')
             .insert([{ id: data.user.id, email: email, full_name: fullName, nim: nim }]);
           
           if (insertError) {
               console.error("Error inserting into public.users", insertError);
           }
        }

        setSuccessMsg("Pendaftaran berhasil! Silakan masuk dengan akun Anda.");
        setActiveTab('login');
        setPassword('');
        setFullName('');
        setNim('');
        // We keep the email so they don't have to retype it
      }
    } catch (err) {
      setErrorMsg("Gagal terhubung ke database. Pastikan VITE_SUPABASE_URL di file .env sudah benar.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Left Split: Branding/Imagery (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-surface-container-low relative flex-col justify-between p-margin-desktop overflow-hidden border-r border-outline-variant">
        {/* Abstract Campus Illustration Pattern/Background */}
        <div 
          className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center opacity-20 mix-blend-multiply" 
          aria-label="A bright, clean, modern university campus scene during daytime with a slight soft-focus effect."
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/80 to-transparent z-0"></div>
        <div className="relative z-10">
          <h1 className="font-headline-lg text-headline-lg text-primary flex items-center gap-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "36px" }}>school</span>
            FindIt Campus
          </h1>
        </div>
        <div className="relative z-10 max-w-[448px]">
          <h2 className="font-headline-xl text-headline-xl text-on-surface mb-md">Temukan kembali barang berharga Anda.</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Platform terpusat yang aman dan terpercaya untuk melaporkan kehilangan dan penemuan barang di lingkungan kampus.</p>
        </div>
      </div>

      {/* Right Split: Auth Forms Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-margin-mobile py-md md:px-margin-desktop bg-surface-container-lowest overflow-hidden">
        <div className="w-full max-w-[480px] mx-auto">
          
          {/* Mobile Logo */}
          <div className="lg:hidden mb-xl text-center">
            <h1 className="font-headline-md text-headline-md text-primary inline-flex items-center gap-xs">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              FindIt Campus
            </h1>
          </div>

          {/* Tab Labels */}
          <div className="flex border-b border-outline-variant mb-md">
            <button 
              className={`flex-1 text-center py-md font-label-md text-label-md transition-colors border-b-2 ${activeTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
              onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              Masuk
            </button>
            <button 
              className={`flex-1 text-center py-md font-label-md text-label-md transition-colors border-b-2 ${activeTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
              onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              Daftar
            </button>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-secondary-container text-on-secondary-container rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          {/* Content Area */}
          <div className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-md md:p-lg">
            
            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <div className="animate-fadeIn">
                <div className="mb-lg">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Selamat Datang Kembali</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Silakan masukkan kredensial Anda untuk melanjutkan.</p>
                </div>
                <form className="flex flex-col gap-md" onSubmit={handleLogin}>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="login-email">Email Universitas</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">mail</span>
                      <input 
                        className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                        id="login-email" 
                        placeholder="nama@kampus.ac.id" 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <div className="flex justify-between items-center">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="login-password">Kata Sandi</label>
                      <Link className="font-label-sm text-label-sm text-primary hover:underline" to="/forgot-password">Lupa kata sandi?</Link>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">lock</span>
                      <input 
                        className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                        id="login-password" 
                        placeholder="••••••••" 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <button disabled={loading} className="mt-sm w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-sm px-lg rounded-lg shadow-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-xs disabled:opacity-50" type="submit">
                    {loading ? 'Memproses...' : 'Masuk'} <span className="material-symbols-outlined text-[18px]">login</span>
                  </button>
                  <div className="flex items-center gap-md my-md">
                    <div className="flex-1 h-px bg-outline-variant"></div>
                    <span className="text-label-sm text-outline px-sm uppercase tracking-wider">atau</span>
                    <div className="flex-1 h-px bg-outline-variant"></div>
                  </div>
                  <button className="w-full bg-surface border border-outline-variant hover:bg-surface-variant/50 text-on-surface font-label-md text-label-md py-sm px-lg rounded-lg shadow-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-sm" type="button">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                    </svg> Masuk dengan Google
                  </button>
                </form>
              </div>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <div className="animate-fadeIn">
                <div className="mb-lg">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Buat Akun Baru</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Daftar untuk mulai melaporkan atau mencari barang.</p>
                </div>
                <form className="flex flex-col gap-md" onSubmit={handleRegister}>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="reg-name">Nama Lengkap</label>
                    <input 
                      className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                      id="reg-name" 
                      placeholder="John Doe" 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="reg-email">Email Universitas</label>
                    <input 
                      className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                      id="reg-email" 
                      placeholder="mahasiswa@kampus.ac.id" 
                      type="email"
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="reg-nim">NIM (Nomor Induk Mahasiswa)</label>
                    <input 
                      className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                      id="reg-nim" 
                      placeholder="1234567890" 
                      type="text"
                      required 
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="reg-password">Kata Sandi</label>
                    <input 
                      className="w-full bg-surface border border-outline-variant rounded-lg px-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                      id="reg-password" 
                      placeholder="Minimal 8 karakter" 
                      type="password"
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button disabled={loading} className="mt-sm w-full bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-label-md py-sm px-lg rounded-lg shadow-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-xs disabled:opacity-50" type="submit">
                    {loading ? 'Memproses...' : 'Daftar Sekarang'} <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Secure Badge */}
          <div className="mt-lg flex items-center justify-center gap-xs text-on-surface-variant font-body-sm text-body-sm opacity-80">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Data Anda diamankan dengan enkripsi standar kampus.
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
