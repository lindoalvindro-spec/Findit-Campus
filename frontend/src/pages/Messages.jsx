import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

  // Initialize and check auth
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Anda harus login untuk menggunakan fitur pesan.');
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
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url),
        receiver:users!messages_receiver_id_fkey(id, full_name, avatar_url)
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
      const { data } = await supabase.from('users').select('id, full_name, avatar_url').eq('id', otherId).single();
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
    if (!newMessage.trim() || !activeChat || !user || isSending) return;

    setIsSending(true);

    const msgText = newMessage.trim();
    setNewMessage(''); // optimistic clear
    broadcastStopTyping();

    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      receiver_id: activeChat.id,
      content: msgText,
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
        content: msgText,
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
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{activeChat.full_name}</h3>
                </div>

                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    const showTime = idx === 0 || new Date(msg.created_at) - new Date(messages[idx-1].created_at) > 300000; // 5 min gap
                    
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                          <span className="text-[11px] text-on-surface-variant mb-2 mt-4 mx-2">
                            {new Date(msg.created_at).toLocaleString('id-ID', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <div 
                          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                            isMe 
                              ? 'bg-primary text-on-primary rounded-tr-sm' 
                              : 'bg-surface-variant text-on-surface-variant rounded-tl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap word-break">{msg.content}</p>
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
                  <form onSubmit={handleSendMessage} className="flex gap-2">
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
                      disabled={!newMessage.trim() || isSending}
                      className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:bg-surface-variant disabled:text-outline hover:bg-primary-container hover:text-on-primary-container transition-colors transform active:scale-95"
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
