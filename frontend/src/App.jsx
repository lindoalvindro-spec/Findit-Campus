import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CreateReport from './pages/CreateReport';
import ItemDetail from './pages/ItemDetail';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import OneSignal from 'react-onesignal';
import { useEffect } from 'react';

const PageTransition = ({ children }) => (
 <motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -12 }}
  transition={{ duration: 0.25, ease: 'easeInOut' }}
  style={{ minHeight: '100vh' }}
 >
  {children}
 </motion.div>
);

function AnimatedRoutes() {
 const location = useLocation();
 return (
  <AnimatePresence mode="wait">
   <Routes location={location} key={location.pathname}>
    <Route path="/" element={<PageTransition><Home /></PageTransition>} />
    <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
    <Route path="/create-report" element={<PageTransition><CreateReport /></PageTransition>} />
    <Route path="/item-detail" element={<PageTransition><ItemDetail /></PageTransition>} />
    <Route path="/lost-items" element={<PageTransition><LostItems /></PageTransition>} />
    <Route path="/found-items" element={<PageTransition><FoundItems /></PageTransition>} />
    <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
    <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
    <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
    <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
   </Routes>
  </AnimatePresence>
 );
}

function App() {
 useEffect(() => {
 let storageListener;
 const initOneSignal = async () => {
 try {
 await OneSignal.init({
 appId:"8d8d85b2-6aeb-4b2b-8521-2abe43cde32a",
 allowLocalhostAsSecureOrigin: true,
 notifyButton: {
 enable: true,
 },
 });

 // Set up user login for notifications from localStorage
 const localUser = localStorage.getItem('user');
 if (localUser) {
 try {
 const user = JSON.parse(localUser);
 OneSignal.login(user.id);
 } catch (e) {
 console.error("Error parsing user from localStorage for OneSignal:", e);
 }
 }
 
 // Listen for auth changes using window storage event
 storageListener = () => {
 const updatedUser = localStorage.getItem('user');
 if (updatedUser) {
 try {
 const user = JSON.parse(updatedUser);
 OneSignal.login(user.id);
 } catch (e) {}
 } else {
 OneSignal.logout();
 }
 };

 window.addEventListener('storage', storageListener);
 } catch (error) {
 console.error('OneSignal Init Error:', error);
 }
 };
 
 initOneSignal();

 return () => {
 if (storageListener) {
 window.removeEventListener('storage', storageListener);
 }
 };
 }, []);


 return (
 <ToastProvider>
 <ConfirmProvider>
 <BrowserRouter>
  <AnimatedRoutes />
 </BrowserRouter>
 </ConfirmProvider>
 </ToastProvider>
 );
}

export default App;
