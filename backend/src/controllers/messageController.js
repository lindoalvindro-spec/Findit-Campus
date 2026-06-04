const db = require('../config/db');

// Fetch unique conversations for the current user
exports.getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const queryText = `
      SELECT m.*,
             json_build_object('id', s.id, 'full_name', s.full_name, 'avatar_url', s.avatar_url, 'last_seen', s.last_seen) as sender,
             json_build_object('id', r.id, 'full_name', r.full_name, 'avatar_url', r.avatar_url, 'last_seen', r.last_seen) as receiver
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY m.created_at DESC
    `;
    const result = await db.query(queryText, [userId]);
    const messages = result.rows;

    const convMap = new Map();

    messages.forEach(msg => {
      const isMeSender = msg.sender_id === userId;
      const otherUser = isMeSender ? msg.receiver : msg.sender;

      if (!convMap.has(otherUser.id)) {
        convMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg.content,
          time: msg.created_at,
          unread: !isMeSender && !msg.is_read
        });
      }
    });

    res.status(200).json(Array.from(convMap.values()));
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil daftar percakapan.' });
  }
};

// Fetch message history between current user and another user
exports.getMessages = async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;

  try {
    const queryText = `
      SELECT * FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;
    const result = await db.query(queryText, [userId, otherUserId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil riwayat pesan.' });
  }
};

// Send new message
exports.sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content, imageUrl, itemId } = req.body;

  if (!receiverId || (!content && !imageUrl)) {
    return res.status(400).json({ message: 'Penerima dan isi pesan/foto wajib diisi.' });
  }

  try {
    const queryText = `
      INSERT INTO messages (sender_id, receiver_id, content, image_url, item_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [senderId, receiverId, content, imageUrl || null, itemId || null];
    const result = await db.query(queryText, values);
    const newMessage = result.rows[0];

    // Trigger OneSignal push notification if API key is configured
    // Note: We read the API key from environment variable which is safer than doing it from frontend
    const restApiKey = process.env.VITE_ONESIGNAL_REST_API_KEY || 'os_v2_app_rwgylmtk5nfsxbjbfk7ehtpdfkykf5whflxevd5pdl4leqj7vllg2ssfvf2ggtrflvryzx5dz3zoebi75t23urz75onzveegjeekiiy';
    if (restApiKey) {
      try {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${restApiKey}`
          },
          body: JSON.stringify({
            app_id: "8d8d85b2-6aeb-4b2b-8521-2abe43cde32a",
            include_aliases: {
              external_id: [receiverId]
            },
            target_channel: "push",
            headings: { "en": `Pesan Baru` },
            contents: { "en": content || '📷 Mengirim foto' },
            url: `https://findit-campus.vercel.app/messages?userId=${senderId}` // Can use standard URL
          })
        });
      } catch (pushErr) {
        console.error("OneSignal push notification error:", pushErr);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengirim pesan.' });
  }
};

// Mark conversation messages as read
exports.markAsRead = async (req, res) => {
  const currentUserId = req.user.id;
  const { senderId } = req.body;

  try {
    const queryText = `
      UPDATE messages
      SET is_read = true
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
    `;
    await db.query(queryText, [currentUserId, senderId]);
    res.status(200).json({ message: 'Pesan ditandai telah dibaca.' });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui status pesan.' });
  }
};

// Mark single message as read
exports.markSingleAsRead = async (req, res) => {
  const currentUserId = req.user.id;
  const { messageId } = req.params;

  try {
    const queryText = `
      UPDATE messages
      SET is_read = true
      WHERE id = $1 AND receiver_id = $2
    `;
    await db.query(queryText, [messageId, currentUserId]);
    res.status(200).json({ message: 'Pesan ditandai telah dibaca.' });
  } catch (error) {
    console.error('Mark Single Message As Read Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui status pesan.' });
  }
};

// Delete single message
exports.deleteMessage = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Only sender can delete their own message
    const checkQuery = 'SELECT sender_id FROM messages WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
    }

    if (checkResult.rows[0].sender_id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak. Anda hanya dapat menghapus pesan Anda sendiri.' });
    }

    const deleteQuery = 'DELETE FROM messages WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.status(200).json({ message: 'Pesan berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus pesan.' });
  }
};

// Delete entire conversation
exports.deleteConversation = async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;

  try {
    const queryText = `
      DELETE FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
    `;
    await db.query(queryText, [userId, otherUserId]);
    res.status(200).json({ message: 'Seluruh percakapan berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Conversation Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus percakapan.' });
  }
};

// Fetch unread count for the current user
exports.getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const queryText = 'SELECT COUNT(*)::int as count FROM messages WHERE receiver_id = $1 AND is_read = false';
    const result = await db.query(queryText, [userId]);
    res.status(200).json({ count: result.rows[0].count });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghitung pesan yang belum dibaca.' });
  }
};

