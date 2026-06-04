import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  useEffect(() => {
    let storageListener;
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "8d8d85b2-6aeb-4b2b-8521-2abe43cde32a",
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/create-report" element={<CreateReport />} />
            <Route path="/item-detail" element={<ItemDetail />} />
            <Route path="/lost-items" element={<LostItems />} />
            <Route path="/found-items" element={<FoundItems />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
