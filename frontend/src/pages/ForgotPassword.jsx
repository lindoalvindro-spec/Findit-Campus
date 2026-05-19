import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage('Tautan pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam Anda.');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengirim instruksi.');
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
          <h2 className="font-headline-xl text-headline-xl text-on-surface mb-md">Lupa Kata Sandi?</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Jangan panik, kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.</p>
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
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Atur Ulang Kata Sandi</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Masukkan email yang terdaftar untuk menerima tautan.</p>
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

            <form className="flex flex-col gap-md" onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Alamat Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">mail</span>
                  <input 
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-md py-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm" 
                    id="email" 
                    placeholder="nama@gmail.com" 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button 
                disabled={loading} 
                className="mt-sm w-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md py-sm px-lg rounded-lg shadow-sm transition-colors active:scale-[0.98] flex items-center justify-center gap-xs disabled:opacity-50" 
                type="submit"
              >
                {loading ? 'Mengirim...' : 'Kirim Instruksi'} 
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>

            <div className="mt-lg text-center">
              <Link to="/auth" className="font-label-sm text-label-sm text-primary hover:underline flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Kembali ke halaman masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
