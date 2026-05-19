import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is currently engaged in a password recovery session.
    // Supabase automatically logs the user in when they click the recovery link,
    // so we should have an active session here.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If there's no session, they probably didn't come from an email link
        // or the link expired.
        setError('Tautan tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.');
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      setMessage('Kata sandi berhasil diperbarui! Mengarahkan Anda ke halaman utama...');
      
      // Clear message and redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Split: Graphic Container */}
      <div className="hidden lg:flex w-1/2 bg-surface-container-low p-md flex-col justify-center relative overflow-hidden border-r border-outline-variant">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 max-w-[448px] ml-auto mr-[10%]">
          <Link to="/" className="inline-flex items-center gap-xs font-headline-md text-headline-md text-primary mb-xl hover:opacity-90 transition-opacity">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20C70 20 45 45 45 75C45 115 100 170 100 170C100 170 155 115 155 75C155 45 130 20 100 20Z" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="100" cy="75" r="25" stroke="currentColor" strokeWidth="10"/>
              <path d="M118 93L135 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
            </svg>
            FindIt Campus
          </Link>
          <h2 className="font-headline-xl text-headline-xl text-on-surface mb-md">Buat Sandi Baru</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Pastikan kata sandi baru Anda kuat dan mudah diingat.</p>
        </div>
      </div>

      {/* Right Split: Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-margin-mobile py-md md:px-margin-desktop bg-surface-container-lowest overflow-hidden">
        <div className="w-full max-w-[480px] mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-xl text-center">
            <Link to="/" className="font-headline-md text-headline-md text-primary inline-flex items-center gap-xs">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 20C70 20 45 45 45 75C45 115 100 170 100 170C100 170 155 115 155 75C155 45 130 20 100 20Z" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="100" cy="75" r="25" stroke="currentColor" strokeWidth="10"/>
                <path d="M118 93L135 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
              </svg>
              FindIt Campus
            </Link>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-xl p-md md:p-lg">
            <div className="mb-lg">
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Buat Sandi Baru</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Masukkan kata sandi baru untuk akun Anda.</p>
            </div>

            {error && (
              <div className="mb-md p-3 bg-error-container text-on-error-container rounded-lg text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-md p-3 bg-secondary-container text-on-secondary-container rounded-lg text-sm">
                {message}
              </div>
            )}

            <form className="flex flex-col gap-md" onSubmit={handleUpdatePassword}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Kata Sandi Baru</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                    id="password" 
                    placeholder="Minimal 6 karakter" 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                    id="confirm-password" 
                    placeholder="Ketik ulang kata sandi" 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                disabled={loading || !!error.includes('Tautan tidak valid')} 
                className="mt-sm w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-sm px-lg rounded-lg shadow-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-xs disabled:opacity-50" 
                type="submit"
              >
                {loading ? 'Menyimpan...' : 'Simpan Sandi Baru'} 
                <span className="material-symbols-outlined text-[18px]">save</span>
              </button>
            </form>

            <div className="mt-lg text-center">
              <Link to="/auth" className="font-label-sm text-label-sm text-primary hover:underline flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">login</span>
                Kembali ke halaman masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
