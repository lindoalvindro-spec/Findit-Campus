import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest border-t border-outline-variant dark:border-outline pt-16 pb-8">
      <div className="w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
          
          {/* Brand & Desc */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim flex items-center gap-2">
              <span className="material-symbols-outlined text-[36px] bg-primary/10 text-primary p-2 rounded-xl">travel_explore</span>
              FindIt Campus
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant max-w-[360px] leading-relaxed mt-2">
              Platform terpercaya bagi mahasiswa untuk melaporkan kehilangan dan penemuan barang di area kampus. Mari saling membantu menciptakan lingkungan yang lebih baik.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">language</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
            </div>
          </div>
          
          {/* Help & Legal */}
          <div className="md:col-span-5 flex flex-col gap-6 md:pl-8">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold tracking-wide uppercase text-sm text-outline">Bantuan & Kebijakan</h3>
            <nav className="flex flex-col gap-4">
              <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Pusat Bantuan (Contact Us)</a>
              <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Tentang Kami (About Us)</a>
              <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Kebijakan Privasi (Privacy Policy)</a>
              <a href="#" className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors">Syarat & Ketentuan (Terms of Service)</a>
            </nav>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-outline-variant/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body-sm text-body-sm text-outline">
            © {new Date().getFullYear()} FindIt Campus. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-1.5 text-outline font-body-sm">
            Dibuat dengan <span className="material-symbols-outlined text-[16px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> untuk Mahasiswa
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
