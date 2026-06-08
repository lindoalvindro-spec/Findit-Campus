import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { apiClient } from '../services/apiClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkImage } from '../utils/nsfwCheck';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const formatLastSeen = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);
  
  if (diffMinutes < 1) return 'Online';
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return `Terakhir dilihat hari ini pukul ${timeStr}`;
  
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate();
  if (isYesterday) return `Terakhir dilihat kemarin pukul ${timeStr}`;
  
  return `Terakhir dilihat ${date.toLocaleDateString('id-ID')} ${timeStr}`;
};
const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const targetUserId = searchParams.get('userId');
  const contextItemId = searchParams.get('itemId');

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCheckingImage, setIsCheckingImage] = useState(false);
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);
  const [contextItem, setContextItem] = useState(null);
  const [loadingContextItem, setLoadingContextItem] = useState(false);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (contextItemId) {
      const fetchContextItem = async () => {
        setLoadingContextItem(true);
        const { data, error } = await apiClient.get(`/api/items/${contextItemId}`);
        if (!error && data) {
          setContextItem(data);
        }
        setLoadingContextItem(false);
      };
      fetchContextItem();
    } else {
      setContextItem(null);
    }
  }, [contextItemId]);

  // Initialize and check auth
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      if (!token || !localUser) {
        toast.warning('Anda harus login untuk menggunakan fitur pesan.');
        navigate('/auth');
        return;
      }
      
      try {
        const loggedInUser = JSON.parse(localUser);
        setUser(loggedInUser);
        await fetchConversations(loggedInUser.id);
      } catch (err) {
        toast.warning('Anda harus login untuk menggunakan fitur pesan.');
        navigate('/auth');
        return;
      }
    };
    init();
  }, [navigate]);

  // Fetch unique conversations
  const fetchConversations = async (currentUserId) => {
    const { data, error } = await apiClient.get('/api/messages/conversations');

    if (!error && data) {
      setConversations(data);

      // If we came from a specific user link, force open that chat
      if (targetUserId && !activeChatRef.current) {
        openChatWithUser(targetUserId, currentUserId, data);
      }
    }
    setLoading(false);
  };

  const openChatWithUser = async (otherId, currentUserId = user?.id, convList = conversations) => {
    if (!currentUserId) return;
    
    // Check if we already have this user in our list
    let otherUserData = convList.find(c => c.user.id === otherId)?.user;
    
    // If not, fetch their details from DB (new chat)
    if (!otherUserData) {
      const { data } = await apiClient.get(`/api/auth/user/${otherId}`);
      if (data) otherUserData = data;
    }

    if (otherUserData) {
      setActiveChat(otherUserData);
      setIsOtherTyping(false);
      fetchMessages(currentUserId, otherId);
      
      // Mark messages as read
      await apiClient.put('/api/messages/read-all', { senderId: otherId });
      // Notify Navbar to update badge
      window.dispatchEvent(new Event('storage'));
    }
  };

  const fetchMessages = async (currentUserId, otherId) => {
    const { data, error } = await apiClient.get(`/api/messages/history/${otherId}`);

    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
  };


  // Socket.io Real-time connection
  useEffect(() => {
    if (!user) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    socket.emit('join_user_room', user.id);

    socket.on('receive_message', (msg) => {
      const active = activeChatRef.current;
      if (active && (msg.sender_id === active.id || msg.receiver_id === active.id)) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
        // Mark as read instantly on server
        apiClient.put(`/api/messages/read-single/${msg.id}`).then();
      }
      fetchConversations(user.id);
    });

    socket.on('typing', ({ sender_id }) => {
      const active = activeChatRef.current;
      if (active && sender_id === active.id) {
        setIsOtherTyping(true);
      }
    });

    socket.on('stop_typing', ({ sender_id }) => {
      const active = activeChatRef.current;
      if (active && sender_id === active.id) {
        setIsOtherTyping(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Update current user's last_seen
  useEffect(() => {
    if (!user) return;
    
    const updateLastSeen = async () => {
      await apiClient.put('/api/auth/last-seen');
    };

    updateLastSeen(); // Initial update
    const interval = setInterval(updateLastSeen, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user]);

  // Periodically fetch activeChat profile info to see dynamic online/offline last_seen updates
  useEffect(() => {
    if (!user || !activeChat) return;

    const interval = setInterval(async () => {
      const { data } = await apiClient.get(`/api/auth/user/${activeChat.id}`);
      if (data) {
        setActiveChat(prev => ({ ...prev, last_seen: data.last_seen }));
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [user, activeChat]);

  const broadcastTyping = () => {
    if (socketRef.current && user && activeChat) {
      socketRef.current.emit('typing', { sender_id: user.id, receiver_id: activeChat.id });
    }
  };

  const broadcastStopTyping = () => {
    if (socketRef.current && user && activeChat) {
      socketRef.current.emit('stop_typing', { sender_id: user.id, receiver_id: activeChat.id });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Auto-scroll when messages change or typing indicator shows
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imagePreview) || !activeChat || !user || isSending) return;

    setIsSending(true);

    const msgText = newMessage.trim();

    setNewMessage('');
    const sentImage = imagePreview;
    setImagePreview(null);
    broadcastStopTyping();

    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: activeChat.id,
      content: msgText || (sentImage ? '📷 Foto' : ''),
      image_url: sentImage || null,
      created_at: new Date().toISOString(),
      item_id: contextItemId || null
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    const { data: savedMsg, error } = await apiClient.post('/api/messages', {
      receiverId: activeChat.id,
      content: msgText || (sentImage ? '📷 Foto' : ''),
      imageUrl: sentImage || null,
      itemId: contextItemId || null
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Broadcast via socket to receiver instantly
      if (socketRef.current) {
        socketRef.current.emit('send_message', savedMsg);
      }
      fetchConversations(user.id);
    }

    // Anti-spam cooldown 500ms
    setTimeout(() => setIsSending(false), 500);
  };

  const handleDeleteMessage = async (msgId) => {
    const { error } = await apiClient.delete(`/api/messages/${msgId}`);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      fetchConversations(user.id);
      toast.success('Pesan berhasil dihapus.', 'Dihapus');
    } else {
      toast.error('Gagal menghapus pesan: ' + error.message);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeChat || !user) return;

    const { error } = await apiClient.delete(`/api/messages/conversation/${activeChat.id}`);

    if (!error) {
      setMessages([]);
      setActiveChat(null);
      fetchConversations(user.id);
      toast.success('Seluruh percakapan berhasil dihapus.', 'Dihapus');
    } else {
      toast.error('Gagal menghapus percakapan: ' + error.message);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('Ukuran file terlalu besar. Maksimal 10MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;

      // NSFW Check
      setIsCheckingImage(true);
      const { isSafe, reason } = await checkImage(dataUrl);
      setIsCheckingImage(false);

      if (!isSafe) {
        toast.error(`Foto ditolak: ${reason}`, 'Konten Tidak Sesuai');
        e.target.value = '';
        return;
      }

      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset so same file can be re-selected
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex flex-col">
        <Navbar />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-grow flex items-center justify-center"
        >
          <motion.span 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="material-symbols-outlined text-4xl text-primary"
          >
            progress_activity
          </motion.span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background font-body-md h-screen flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-md md:py-lg flex overflow-hidden h-full">
        <div className="flex w-full bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden h-[calc(100vh-140px)]">
          
          {/* Sidebar / Conversations List */}
          <div className={`${activeChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] lg:w-[380px] border-r border-outline-variant bg-surface-container-lowest`}>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-b border-outline-variant bg-surface"
            >
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Pesan</h2>
            </motion.div>
            
            <div className="flex-grow overflow-y-auto">
              {conversations.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="p-6 text-center text-on-surface-variant flex flex-col items-center justify-center h-full"
                >
                  <motion.span 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="material-symbols-outlined text-[48px] opacity-20 mb-2"
                  >
                    forum
                  </motion.span>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Belum ada percakapan.
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}
                >
                  {conversations.map((conv) => {
                    const isOnline = formatLastSeen(conv.user.last_seen) === 'Online';
                    return (
                      <motion.button
                        key={conv.user.id}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.015)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChatWithUser(conv.user.id)}
                        className={`w-full text-left p-4 flex items-center gap-3 border-b border-outline-variant/30 transition-all ${
                          activeChat?.id === conv.user.id 
                            ? 'bg-primary/5 border-l-4 border-primary shadow-[inset_1px_0_0_rgba(0,0,0,0.02)]' 
                            : 'border-l-4 border-transparent'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center border border-outline-variant/20 flex-shrink-0"
                          >
                            {conv.user.avatar_url ? (
                              <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-bold text-sm">
                                {conv.user.full_name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </motion.div>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-2 border-surface-container-lowest rounded-full animate-pulse z-10" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className={`font-label-md text-label-md truncate ${conv.unread ? 'font-bold text-on-surface' : 'text-on-surface'}`}>{conv.user.full_name}</h3>
                            <span className="text-[10px] text-on-surface-variant flex-shrink-0 ml-2">
                              {new Date(conv.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${conv.unread ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unread && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                            className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0"
                            style={{
                              boxShadow: '0 0 8px rgba(var(--primary-rgb, 103, 80, 164), 0.6)'
                            }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-col flex-grow bg-surface relative`}>
            {activeChat ? (
              <>
                 {/* Chat Header */}
                 <motion.div 
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.3 }}
                   className="h-[72px] p-4 border-b border-outline-variant flex items-center justify-between bg-surface z-10 shadow-sm"
                 >
                   <div className="flex items-center gap-3 min-w-0 flex-1">
                     <motion.button 
                       whileHover={{ scale: 1.1 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setActiveChat(null)}
                       className="md:hidden p-2 -ml-2 rounded-full text-on-surface hover:bg-surface-variant"
                     >
                       <span className="material-symbols-outlined">arrow_back</span>
                     </motion.button>
                     <div className="relative flex-shrink-0">
                       <motion.div 
                         initial={{ scale: 0 }}
                         animate={{ scale: 1 }}
                         transition={{ type: "spring", stiffness: 300 }}
                         className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center border border-outline-variant/20 flex-shrink-0"
                       >
                         {activeChat.avatar_url ? (
                           <img src={activeChat.avatar_url} alt={activeChat.full_name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-bold text-sm">
                             {activeChat.full_name?.charAt(0).toUpperCase()}
                           </div>
                         )}
                       </motion.div>
                       {formatLastSeen(activeChat.last_seen) === 'Online' && (
                         <span className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-surface rounded-full animate-pulse z-10" />
                       )}
                     </div>
                     <motion.div 
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.1 }}
                       className="flex flex-col min-w-0"
                     >
                       <h3 className="font-label-md text-label-md text-on-surface leading-tight truncate">{activeChat.full_name}</h3>
                       <AnimatePresence mode="wait">
                         {isOtherTyping ? (
                           <motion.span
                             key="typing"
                             initial={{ opacity: 0, y: -5 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: 5 }}
                             className="text-[11px] text-primary italic font-semibold flex items-center gap-1 mt-0.5"
                           >
                             <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                             Sedang mengetik...
                           </motion.span>
                         ) : formatLastSeen(activeChat.last_seen) === 'Online' ? (
                           <motion.span
                             key="online"
                             initial={{ opacity: 0, y: -5 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: 5 }}
                             className="text-[11px] text-success font-semibold flex items-center gap-1 mt-0.5"
                           >
                             <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                             Online
                           </motion.span>
                         ) : (
                           <motion.span
                             key="lastseen"
                             initial={{ opacity: 0, y: -5 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: 5 }}
                             className="text-[11px] text-on-surface-variant font-medium mt-0.5 truncate"
                           >
                             {formatLastSeen(activeChat.last_seen)}
                           </motion.span>
                         )}
                       </AnimatePresence>
                     </motion.div>
                   </div>
                   <motion.button
                     whileHover={{ scale: 1.1, rotate: 10 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={async () => {
                       const yes = await confirm({
                         title: 'Hapus Percakapan?',
                         message: `Semua pesan dengan ${activeChat.full_name} akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.`,
                         confirmText: 'Ya, Hapus',
                         cancelText: 'Batal',
                         type: 'danger'
                       });
                       if (yes) handleDeleteConversation();
                     }}
                     className="p-2 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0 ml-2"
                     title="Hapus percakapan"
                   >
                     <span className="material-symbols-outlined text-[20px]">delete</span>
                   </motion.button>
                  </motion.div>

                  {/* Context Item Sticky Header */}
                  {contextItem && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-surface-container-low/95 border-b border-outline-variant/40 px-4 py-2.5 flex items-center justify-between backdrop-blur-md z-10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0 border border-outline-variant/20">
                          {contextItem.image_url ? (
                            <img src={contextItem.image_url} alt={contextItem.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-xl">inventory_2</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-on-surface max-w-[200px] truncate">{contextItem.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              contextItem.status === 'lost' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                            }`}>
                              {contextItem.status === 'lost' ? 'Hilang' : 'Ditemukan'}
                            </span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                            <span className="material-symbols-outlined text-[12px] text-outline">location_on</span>
                            {contextItem.location || 'Area Kampus'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/item-detail?id=${contextItem.id}`}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 font-bold text-[10px] transition-colors"
                        >
                          Lihat Detail
                        </Link>
                        <button 
                          onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.delete('itemId');
                            navigate(`/messages?${newParams.toString()}`, { replace: true });
                          }}
                          className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors"
                          title="Tutup konteks barang"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
 
                 {/* Messages Area */}
                  <div className="flex-grow overflow-y-auto p-4 bg-surface-container-lowest flex flex-col">
                   <AnimatePresence initial={false}>
                     {messages.map((msg, idx) => {
                       const isMe = msg.sender_id === user.id;
                       const showTime = idx === 0 || new Date(msg.created_at) - new Date(messages[idx-1].created_at) > 300000; // 5 min gap
                       const prevMsg = idx > 0 ? messages[idx - 1] : null;
                       const isConsecutive = prevMsg && prevMsg.sender_id === msg.sender_id && (new Date(msg.created_at) - new Date(prevMsg.created_at) < 60000) && !showTime;

                       return (
                         <React.Fragment key={msg.id}>
                           {showTime && (
                             <motion.div 
                               initial={{ opacity: 0, y: -10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="w-full flex justify-center my-4"
                             >
                               <span className="text-[11px] bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-medium shadow-sm">
                                 {new Date(msg.created_at).toLocaleString('id-ID', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </motion.div>
                           )}
                           <motion.div 
                             initial={{ 
                               opacity: 0, 
                               x: isMe ? 20 : -20,
                               scale: 0.95
                             }}
                             animate={{ 
                               opacity: 1, 
                               x: 0,
                               scale: 1
                             }}
                             exit={{ 
                               opacity: 0, 
                               scale: 0.8,
                               transition: { duration: 0.2 }
                             }}
                             transition={{ 
                               type: "spring", 
                               stiffness: 300,
                               damping: 25
                             }}
                             className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1.5' : 'mt-4'}`}
                           >
                             <motion.div 
                               whileHover={{ scale: 1.01 }}
                               className={`max-w-[75%] overflow-hidden shadow-sm transition-all duration-200 border border-outline-variant/10 ${
                                 isMe 
                                   ? `bg-gradient-to-br from-primary to-[#2563eb] text-on-primary rounded-2xl ${isConsecutive ? 'rounded-tr-2xl' : 'rounded-tr-sm'}` 
                                   : `bg-surface border border-outline-variant/30 text-on-surface rounded-2xl ${isConsecutive ? 'rounded-tl-2xl' : 'rounded-tl-sm'}`
                               }`}
                             >
                               {msg.image_url && (
                                 <motion.img 
                                   initial={{ opacity: 0, scale: 0.8 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   transition={{ delay: 0.1 }}
                                   src={msg.image_url} 
                                   alt="Foto" 
                                   className="w-full max-w-[280px] object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                   onClick={() => window.open(msg.image_url, '_blank')}
                                 />
                               )}
                               {msg.content && msg.content !== '📷 Foto' && (
                                 <p className="whitespace-pre-wrap word-break px-4 pt-2 pb-1 text-sm leading-relaxed">{msg.content}</p>
                               )}
                               {msg.image_url && !msg.content && (
                                 <div className="h-0"></div>
                               )}
                               
                               {/* Time and Checkmarks inside bubble */}
                               <div className={`flex items-center justify-end gap-1 px-3 pb-1.5 ${isMe ? 'text-white/80' : 'text-on-surface-variant/80'}`}>
                                 <span className="text-[10px]">
                                   {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                                 {isMe && (
                                   <motion.span 
                                     initial={{ scale: 0 }}
                                     animate={{ scale: 1 }}
                                     className="material-symbols-outlined text-[14px]"
                                     style={{ color: msg.is_read ? '#38bdf8' : 'currentColor' }}
                                     title={msg.is_read ? "Dibaca" : "Terkirim"}
                                   >
                                     {msg.is_read ? 'done_all' : 'done'}
                                   </motion.span>
                                 )}
                               </div>
                             </motion.div>
                             
                             <div className="flex items-center justify-end w-full mt-1">
                               {/* Delete button on hover */}
                               <motion.button
                                 initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                                 whileHover={{ opacity: 1, x: 0 }}
                                 transition={{ duration: 0.2 }}
                                 onClick={() => handleDeleteMessage(msg.id)}
                                 className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[11px] text-on-surface-variant hover:text-red-500"
                                 title="Hapus pesan"
                               >
                                 <span className="material-symbols-outlined text-[14px]">delete</span>
                                 Hapus
                               </motion.button>
                            </div>
                          </motion.div>
                        </React.Fragment>
                      );
                    })}
                  </AnimatePresence>
                  <AnimatePresence>
                    {isOtherTyping && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex items-end gap-2 mt-2"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant flex-shrink-0 border border-outline-variant/20">
                          {activeChat.avatar_url ? (
                            <img src={activeChat.avatar_url} alt={activeChat.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs font-bold">
                              {activeChat.full_name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="bg-surface border border-outline-variant/30 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm max-w-max">
                            <motion.span 
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-1.5 h-1.5 bg-primary/75 rounded-full"
                            />
                            <motion.span 
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                              className="w-1.5 h-1.5 bg-primary/75 rounded-full"
                            />
                            <motion.span 
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                              className="w-1.5 h-1.5 bg-primary/75 rounded-full"
                            />
                          </div>
                          <span className="text-[10px] text-on-surface-variant mt-1 ml-1">
                            {activeChat.full_name} sedang mengetik...
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-surface-container-lowest border-t border-outline-variant/40"
                >
                  {/* Image Preview */}
                  <AnimatePresence>
                    {imagePreview && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="mb-3 relative inline-block"
                      >
                        <img src={imagePreview} alt="Preview" className="h-24 rounded-lg border border-outline-variant shadow-sm object-cover animate-pulse" />
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Checking Image Indicator */}
                  <AnimatePresence>
                    {isCheckingImage && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-3 flex items-center gap-2 text-sm text-on-surface-variant"
                      >
                        <motion.span 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="material-symbols-outlined text-[18px]"
                        >
                          progress_activity
                        </motion.span>
                        Memeriksa keamanan foto...
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isSending || isCheckingImage}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
                      title="Kirim foto"
                    >
                      <span className="material-symbols-outlined text-[24px]">image</span>
                    </motion.button>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (e.target.value.trim()) {
                          broadcastTyping();
                        } else {
                          broadcastStopTyping();
                        }
                      }}
                      placeholder="Ketik pesan..."
                      className="flex-grow bg-surface-variant border-none rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-body-md text-on-surface transition-all"
                    />
                    <motion.button 
                      type="submit"
                      disabled={(!newMessage.trim() && !imagePreview) || isSending}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9, rotate: -15 }}
                      animate={newMessage.trim() || imagePreview ? { 
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{ 
                        scale: { duration: 0.3, repeat: newMessage.trim() ? Infinity : 0, repeatDelay: 2 }
                      }}
                      className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:bg-surface-variant disabled:text-outline hover:bg-primary-container hover:text-on-primary-container transition-colors flex-shrink-0"
                    >
                      <motion.span 
                        animate={isSending ? { x: [0, 5, 0] } : {}}
                        transition={{ duration: 0.3, repeat: isSending ? Infinity : 0 }}
                        className="material-symbols-outlined" 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        send
                      </motion.span>
                    </motion.button>
                  </form>
                </motion.div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex-grow flex flex-col items-center justify-center text-on-surface-variant p-8 text-center bg-surface-container-lowest"
              >
                <motion.span 
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="material-symbols-outlined text-[80px] opacity-20 mb-4"
                >
                  forum
                </motion.span>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-headline-sm text-on-surface mb-2"
                >
                  Mulai Percakapan
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Pilih pesan dari daftar di samping untuk mulai mengobrol.
                </motion.p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
