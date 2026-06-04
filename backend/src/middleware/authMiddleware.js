const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Format token salah. Harus berupa Bearer Token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyfinditcampusuas2026');
    req.user = verified; // Contains id and email
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa.' });
  }
};

module.exports = authMiddleware;
