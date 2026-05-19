import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkImage } from '../utils/nsfwCheck';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

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
  const typingChannelRef = useRef(null);
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCheckingImage, setIsCheckingImage] = useState(false);

  // Initialize and check auth
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.warning('Anda harus login untuk menggunakan fitur pesan.');
        navigate('/auth');
        return;
      }
      setUser(session.user);
      await fetchConversations(session.user.id);
    };
    init();
  }, [navigate]);

  // Fetch unique conversations
  const fetchConversations = async (currentUserId) => {
    // Supabase doesn't easily do "distinct" queries with joins, so we fetch all messages for the user 
    // and group them in Javascript. In production, an RPC or Edge function is better.
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url, last_seen),
        receiver:users!messages_receiver_id_fkey(id, full_name, avatar_url, last_seen)
      `)
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const convMap = new Map();
      
      data.forEach(msg => {
        const isMeSender = msg.sender_id === currentUserId;
        const otherUser = isMeSender ? msg.receiver : msg.sender;
        
        if (!convMap.has(otherUser.id)) {
          convMap.set(otherUser.id, {
            user: otherUser,
            lastMessage: msg.content,
            time: msg.created_at,
            unread: !isMeSender && !msg.is_read // Very basic unread logic
          });
        }
      });
      
      const convList = Array.from(convMap.values());
      setConversations(convList);

      // If we came from a specific user link, force open that chat
      if (targetUserId) {
        openChatWithUser(targetUserId, currentUserId, convList);
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
      const { data } = await supabase.from('users').select('id, full_name, avatar_url, last_seen').eq('id', otherId).single();
      if (data) otherUserData = data;
    }

    if (otherUserData) {
      setActiveChat(otherUserData);
      setIsOtherTyping(false);
      fetchMessages(currentUserId, otherId);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', otherId);
    }
  };

  const fetchMessages = async (currentUserId, otherId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  // Realtime Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        const newMsg = payload.new;
        // If the message is from the currently active chat
        if (activeChat && newMsg.sender_id === activeChat.id) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
          // Mark as read instantly
          supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then();
        } else {
          // Otherwise, just refresh conversations to show new unread
          fetchConversations(user.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, (payload) => {
        const updatedMsg = payload.new;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChat]);

  // Update current user's last_seen
  useEffect(() => {
    if (!user) return;
    
    const updateLastSeen = async () => {
      await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
    };

    updateLastSeen(); // Initial update
    const interval = setInterval(updateLastSeen, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user]);

  // Listen to activeChat's last_seen updates
  useEffect(() => {
    if (!user || !activeChat) return;

    const channel = supabase
      .channel('public:users')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${activeChat.id}`
      }, (payload) => {
        setActiveChat(prev => ({ ...prev, last_seen: payload.new.last_seen }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChat]);

  // Typing indicator via Supabase Broadcast
  useEffect(() => {
    if (!user || !activeChat) {
      // Cleanup old channel
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      return;
    }

    // Create a unique room for this pair (sorted IDs so both users join the same room)
    const roomIds = [user.id, activeChat.id].sort().join('-');
    const channelName = `typing:${roomIds}`;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setIsOtherTyping(true);
          // Auto-hide after 2.5 seconds of no typing event
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 2500);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setIsOtherTyping(false);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, activeChat]);

  const broadcastTyping = () => {
    if (typingChannelRef.current && user) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id }
      });
    }
  };

  const broadcastStopTyping = () => {
    if (typingChannelRef.current && user) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: user.id }
      });
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

    const { error } = await supabase
      .from('messages')
      .insert([{
        sender_id: user.id,
        receiver_id: activeChat.id,
        content: msgText || (sentImage ? '📷 Foto' : ''),
        image_url: sentImage || null,
        item_id: contextItemId || null
      }]);

    if (error) {
      console.error("Error sending message:", error);
      // In a real app, you'd show an error toast and maybe remove the optimistic message
    } else {
      fetchConversations(user.id); // Update sidebar last message
    }

    // Anti-spam cooldown 500ms
    setTimeout(() => setIsSending(false), 500);
  };

  const handleDeleteMessage = async (msgId) => {
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
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

    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${user.id})`);

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
        <div className="flex-grow flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
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
            <div className="p-4 border-b border-outline-variant bg-surface">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Pesan</h2>
            </div>
            
            <div className="flex-grow overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">forum</span>
                  <p>Belum ada percakapan.</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button 
                    key={conv.user.id}
                    onClick={() => openChatWithUser(conv.user.id)}
                    className={`w-full text-left p-4 flex items-center gap-3 border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors ${activeChat?.id === conv.user.id ? 'bg-primary-fixed-dim/20' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex-shrink-0">
                      {conv.user.avatar_url ? (
                        <img src={conv.user.avatar_url} alt={conv.user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-headline-sm">
                          {conv.user.full_name?.charAt(0).toUpperCase()}
                        </div>
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
                      <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0"></div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${!activeChat ? 'hidden md:flex' : 'flex'} flex-col flex-grow bg-surface relative`}>
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="h-[72px] p-4 border-b border-outline-variant flex items-center gap-3 bg-surface z-10 shadow-sm">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-2 -ml-2 rounded-full text-on-surface hover:bg-surface-variant"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex-shrink-0">
                    {activeChat.avatar_url ? (
                      <img src={activeChat.avatar_url} alt={activeChat.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                        {activeChat.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-grow">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight">{activeChat.full_name}</h3>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {isOtherTyping ? (
                        <span className="text-primary italic">Sedang mengetik...</span>
                      ) : (
                        formatLastSeen(activeChat.last_seen)
                      )}
                    </span>
                  </div>
                  <button
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
                    className="p-2 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Hapus percakapan"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    const showTime = idx === 0 || new Date(msg.created_at) - new Date(messages[idx-1].created_at) > 300000; // 5 min gap
                    
                    return (
                      <div key={msg.id} className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                          <div className="w-full flex justify-center my-4">
                            <span className="text-[11px] bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-medium shadow-sm">
                              {new Date(msg.created_at).toLocaleString('id-ID', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <div 
                          className={`max-w-[75%] rounded-2xl overflow-hidden ${
                            isMe 
                              ? 'bg-primary text-on-primary rounded-tr-sm' 
                              : 'bg-surface-variant text-on-surface-variant rounded-tl-sm'
                          }`}
                        >
                          {msg.image_url && (
                            <img 
                              src={msg.image_url} 
                              alt="Foto" 
                              className="w-full max-w-[280px] object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                              onClick={() => window.open(msg.image_url, '_blank')}
                            />
                          )}
                          {msg.content && msg.content !== '📷 Foto' && (
                            <p className="whitespace-pre-wrap word-break px-4 pt-2 pb-1">{msg.content}</p>
                          )}
                          {msg.image_url && !msg.content && (
                            <div className="h-0"></div>
                          )}
                          
                          {/* Time and Checkmarks inside bubble */}
                          <div className={`flex items-center justify-end gap-1 px-3 pb-1.5 ${isMe ? 'text-primary-container' : 'text-on-surface-variant'} opacity-80`}>
                            <span className="text-[10px]">
                              {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span 
                                className="material-symbols-outlined text-[14px]"
                                style={{ color: msg.is_read ? '#60a5fa' : 'currentColor' }}
                                title={msg.is_read ? "Dibaca" : "Terkirim"}
                              >
                                {msg.is_read ? 'done_all' : 'done'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end w-full mt-1">
                          {/* Delete button on hover */}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-[11px] text-on-surface-variant hover:text-red-500"
                            title="Hapus pesan"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {isOtherTyping && (
                    <div className="flex flex-col items-start">
                      <div className="bg-surface-variant rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                        <span className="w-2 h-2 bg-on-surface-variant/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-on-surface-variant/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-on-surface-variant/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant mt-1 ml-1">sedang mengetik...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-surface border-t border-outline-variant">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-24 rounded-lg border border-outline-variant shadow-sm object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  )}
                  {/* Checking Image Indicator */}
                  {isCheckingImage && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Memeriksa keamanan foto...
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isSending || isCheckingImage}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Kirim foto"
                    >
                      <span className="material-symbols-outlined text-[24px]">image</span>
                    </button>
                    <input
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
                      className="flex-grow bg-surface-variant border-none rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-body-md text-on-surface"
                    />
                    <button 
                      type="submit"
                      disabled={(!newMessage.trim() && !imagePreview) || isSending}
                      className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:bg-surface-variant disabled:text-outline hover:bg-primary-container hover:text-on-primary-container transition-colors transform active:scale-95 flex-shrink-0"
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-on-surface-variant p-8 text-center bg-surface-container-lowest">
                <span className="material-symbols-outlined text-[80px] opacity-20 mb-4">forum</span>
                <h3 className="font-headline-sm text-on-surface mb-2">Mulai Percakapan</h3>
                <p>Pilih pesan dari daftar di samping untuk mulai mengobrol.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
