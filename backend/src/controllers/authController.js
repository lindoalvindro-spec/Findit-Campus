const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetPasswordEmail } = require('../config/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyfinditcampusuas2026';

// Register User
exports.register = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Nama lengkap, email, dan password wajib diisi.' });
  }

  try {
    // Check if user already exists
    const userExistQuery = 'SELECT * FROM users WHERE email = $1';
    const userExistResult = await db.query(userExistQuery, [email.toLowerCase().trim()]);

    if (userExistResult.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to database
    const insertQuery = `
      INSERT INTO users (full_name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, email, created_at
    `;
    const newUserResult = await db.query(insertQuery, [fullName, email.toLowerCase().trim(), hashedPassword]);
    const newUser = newUserResult.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        full_name: newUser.full_name,
        email: newUser.email,
        createdAt: newUser.created_at,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat registrasi.' });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    // Check if user exists
    const findUserQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await db.query(findUserQuery, [email.toLowerCase().trim()]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const user = userResult.rows[0];

    // Check password
    if (!user.password_hash) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        full_name: user.full_name,
        email: user.email,
        avatarUrl: user.avatar_url,
        avatar_url: user.avatar_url,
        createdAt: user.created_at,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login.' });
  }
};

// Get Current User Profile (Me)
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const userQuery = 'SELECT id, full_name, email, avatar_url, last_seen, created_at FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const user = userResult.rows[0];
    res.status(200).json({
      id: user.id,
      fullName: user.full_name,
      full_name: user.full_name,
      email: user.email,
      avatarUrl: user.avatar_url,
      avatar_url: user.avatar_url,
      lastSeen: user.last_seen,
      last_seen: user.last_seen,
      createdAt: user.created_at,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data profil.' });
  }
};

// Get User by ID (Public info for chat/details)
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const userQuery = 'SELECT id, full_name, avatar_url, last_seen FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    const user = userResult.rows[0];
    res.status(200).json({
      id: user.id,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      last_seen: user.last_seen
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data user.' });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { fullName, avatarUrl } = req.body;

  try {
    const queryText = `
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          avatar_url = COALESCE($2, avatar_url)
      WHERE id = $3
      RETURNING id, full_name, email, avatar_url, last_seen
    `;
    const result = await db.query(queryText, [fullName, avatarUrl, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.status(200).json({
      message: 'Profil berhasil diperbarui!',
      user: {
        id: result.rows[0].id,
        fullName: result.rows[0].full_name,
        full_name: result.rows[0].full_name,
        email: result.rows[0].email,
        avatarUrl: result.rows[0].avatar_url,
        avatar_url: result.rows[0].avatar_url,
        lastSeen: result.rows[0].last_seen,
        last_seen: result.rows[0].last_seen
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat memperbarui profil.' });
  }
};

// Update Last Seen Timestamp
exports.updateLastSeen = async (req, res) => {
  const userId = req.user.id;

  try {
    const queryText = `
      UPDATE users
      SET last_seen = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, last_seen
    `;
    const result = await db.query(queryText, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.status(200).json({
      message: 'Status keaktifan diperbarui.',
      lastSeen: result.rows[0].last_seen
    });
  } catch (error) {
    console.error('Update Last Seen Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat memperbarui status keaktifan.' });
  }
};

// Forgot Password - Kirim email reset via Gmail SMTP (Bypass DB untuk Test)
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email wajib diisi.' });
  }

  try {
    // BYPASS SUPABASE: Langsung anggap email valid untuk keperluan testing
    console.log(`[TEST MODE] Mengabaikan pengecekan database untuk email: ${email}`);
    
    // Mock user object
    const user = {
      email: email.toLowerCase().trim(),
      full_name: 'Pengguna Test'
    };

    // Generate short-lived reset token (15 mins)
    const token = jwt.sign(
      { email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Buat reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Kirim email via Gmail SMTP
    await sendResetPasswordEmail(user.email, user.full_name, resetLink);

    res.status(200).json({
      message: 'Instruksi reset kata sandi telah dikirim ke email Anda (Test Mode).'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengirim email reset kata sandi.' });
  }
};


// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token reset wajib disertakan.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ message: 'Token valid.', email: verified.email });
  } catch (error) {
    res.status(400).json({ message: 'Token reset tidak valid atau telah kedaluwarsa.' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token dan password baru wajib diisi.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    const email = verified.email;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const queryText = `
      UPDATE users
      SET password_hash = $1
      WHERE email = $2
      RETURNING id, email
    `;
    const result = await db.query(queryText, [hashedPassword, email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gagal mereset sandi. User tidak ditemukan.' });
    }

    res.status(200).json({ message: 'Kata sandi berhasil diperbarui.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(400).json({ message: 'Gagal mereset sandi. Token tidak valid atau kedaluwarsa.' });
  }
};



