import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const socialLinks = [
    { icon: 'language', label: 'Website' },
    { icon: 'share', label: 'Share' },
    { icon: 'mail', label: 'Email' }
  ];

  const helpLinks = [
    { text: 'Pusat Bantuan (Contact Us)', href: '#' },
    { text: 'Tentang Kami (About Us)', href: '#' },
    { text: 'Kebijakan Privasi (Privacy Policy)', href: '#' },
    { text: 'Syarat & Ketentuan (Terms of Service)', href: '#' }
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
              <motion.span 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="material-symbols-outlined text-[36px] bg-primary/10 text-primary p-2 rounded-xl cursor-pointer"
              >
                travel_explore
              </motion.span>
              FindIt Campus
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant max-w-[360px] leading-relaxed mt-2">
              Platform terpercaya bagi mahasiswa untuk melaporkan kehilangan dan penemuan barang di area kampus. Mari saling membantu menciptakan lingkungan yang lebih baik.
            </p>
            <div className="flex gap-3 mt-4">
              {socialLinks.map((link, index) => (
                <motion.a 
                  key={index}
                  href="#" 
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                  title={link.label}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
          
          {/* Help & Legal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-5 flex flex-col gap-6 md:pl-8"
          >
            <h3 className="font-title-md text-title-md text-on-surface font-semibold tracking-wide uppercase text-sm text-outline">Bantuan & Kebijakan</h3>
            <nav className="flex flex-col gap-4">
              {helpLinks.map((link, index) => (
                <motion.a 
                  key={index}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.text}
                </motion.a>
              ))}
            </nav>
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
