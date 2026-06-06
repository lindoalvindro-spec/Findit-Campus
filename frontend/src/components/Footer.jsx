import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from './Toast';

const Footer = () => {
  const toast = useToast();

  const handleShare = async (e) => {
    e.preventDefault();
    const shareUrl = 'https://findit-campus-omega.vercel.app/';
    const shareData = {
      title: 'FindIt Campus',
      text: 'Platform pelaporan barang hilang dan temuan di area kampus.',
      url: shareUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Tautan aplikasi berhasil disalin ke clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Gagal membagikan tautan.');
      }
    }
  };

  const socialLinks = [
    { 
      icon: 'support_agent', 
      label: 'Pusat Bantuan', 
      href: 'https://wa.me/6287866272028?text=Halo%20Admin%20FindIt%20Campus%2C%20saya%20butuh%20bantuan%20terkait%20penggunaan%20aplikasi.', 
      target: '_blank', 
      rel: 'noopener noreferrer' 
    },
    { 
      icon: 'share', 
      label: 'Share', 
      onClick: handleShare 
    },
    { 
      icon: 'chat', 
      label: 'WhatsApp Admin', 
      href: 'https://wa.me/6287866272028?text=Halo%20Admin%20FindIt%20Campus%2C%20saya%20ingin%20melaporkan%20kendala%20sistem.',
      target: '_blank', 
      rel: 'noopener noreferrer' 
    }
  ];

  const contributors = [
    { 
      name: 'Lindo Alvindro', 
      username: 'lindoalvindro-spec', 
      href: 'https://github.com/lindoalvindro-spec',
      avatar: 'https://github.com/lindoalvindro-spec.png',
      instagram: 'https://www.instagram.com/ndo_xd?igsh=bmJ1MnYxOW9menZ4'
    },
    { 
      name: 'Rizki Amanda', 
      username: 'furky1246', 
      href: 'https://github.com/furky1246',
      avatar: 'https://github.com/furky1246.png',
      instagram: 'https://www.instagram.com/m.rizky_65?igsh=MWt1cWlzZ3JhcnJ3Yw=='
    },
    { 
      name: 'Nabil Rifqi', 
      username: 'nabilrifqi17', 
      href: 'https://github.com/nabilrifqi17',
      avatar: 'https://github.com/nabilrifqi17.png',
      instagram: 'https://www.instagram.com/_nabilrifqi?igsh=MThrMDI1NHVubzl5'
    }
  ];

  return (
    <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest border-t border-outline-variant dark:border-outline pt-16 pb-8">
      <div className="w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
          
          {/* Brand & Desc */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-7 flex flex-col gap-4"
          >
            <div className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim flex items-center gap-2">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.05 }}
                transition={{ duration: 0.6 }}
                className="bg-primary/10 p-2 rounded-xl cursor-pointer"
              >
                <svg 
                  className="w-9 h-9 text-primary" 
                  viewBox="0 0 200 200" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M100 20C70 20 45 45 45 75C45 115 100 170 100 170C100 170 155 115 155 75C155 45 130 20 100 20Z" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="100" cy="75" r="25" stroke="currentColor" strokeWidth="10"/>
                  <path d="M118 93L135 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
                </svg>
              </motion.div>
              FindIt Campus
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant max-w-[360px] leading-relaxed mt-2">
              Platform terpercaya bagi mahasiswa untuk melaporkan kehilangan dan penemuan barang di area kampus. Mari saling membantu menciptakan lingkungan yang lebih baik.
            </p>
            <div className="flex gap-3 mt-4">
              {socialLinks.map((link, index) => (
                <motion.a 
                  key={index}
                  href={link.href || '#'}
                  onClick={link.onClick}
                  target={link.target}
                  rel={link.rel}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm cursor-pointer"
                  title={link.label}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* Contributors & Socials */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-5 flex flex-col gap-6 md:pl-8"
          >
            <div className="flex items-center gap-2 text-on-surface dark:text-primary-fixed-dim">
              <span className="material-symbols-outlined text-[22px] text-outline dark:text-outline-variant">group</span>
              <h3 className="font-label-md text-label-md font-semibold tracking-wide uppercase text-sm text-outline dark:text-outline-variant">Connect with Us!</h3>
            </div>
            <div className="flex flex-col gap-3">
              {contributors.map((contrib, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <img 
                    src={contrib.avatar} 
                    alt={contrib.name}
                    className="w-10 h-10 rounded-full border border-outline-variant group-hover:border-primary transition-all object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${contrib.username}`;
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-medium group-hover:text-primary transition-colors">
                      {contrib.name}
                    </span>
                  </div>
                  
                  {/* Action Social Buttons */}
                  <div className="flex items-center gap-2 ml-auto">
                    <motion.a
                      href={contrib.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full border border-outline-variant/80 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/10 transition-all shadow-sm"
                      title="GitHub"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </motion.a>
                    <motion.a
                      href={contrib.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-full border border-outline-variant/80 flex items-center justify-center text-on-surface-variant hover:text-pink-600 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all shadow-sm"
                      title="Instagram"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2c2.717 0 3.039.01 4.102.059 1.06.048 1.782.217 2.416.465a4.875 4.875 0 011.737 1.13 4.875 4.875 0 011.13 1.737c.248.634.417 1.356.465 2.416.049 1.063.059 1.385.059 4.102s-.01 3.039-.059 4.102c-.048 1.06-.217 1.782-.465 2.416a4.89 4.89 0 01-1.13 1.737 4.89 4.89 0 01-1.737 1.13c-.634.248-1.356.417-2.416.465-1.063.049-1.385.059-4.102.059s-3.039-.01-4.102-.059c-1.06-.048-1.782-.217-2.416-.465a4.89 4.89 0 01-1.737-1.13 4.89 4.89 0 01-1.13-1.737c-.248-.634-.417-1.356-.465-2.416C2.01 15.039 2 14.717 2 12s.01-3.039.059-4.102c.048-1.06.217-1.782.465-2.416a4.89 4.89 0 011.13-1.737 4.89 4.89 0 011.737-1.13c.634-.248 1.356-.417 2.416-.465C8.961 2.01 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm5.83-8.83a1.17 1.17 0 100 2.34 1.17 0 000-2.34z" clipRule="evenodd" />
                      </svg>
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-8 border-t border-outline-variant/60 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="font-body-sm text-body-sm text-outline">
            © {new Date().getFullYear()} FindIt Campus. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-1.5 text-outline font-body-sm">
            Dibuat dengan 
            <motion.span 
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="material-symbols-outlined text-[16px] text-error" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </motion.span> 
            untuk Mahasiswa
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
