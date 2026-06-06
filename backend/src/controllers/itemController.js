const db = require('../config/db');

// Get all items with optional filters
exports.getItems = async (req, res) => {
  const { status, search, userId, campus } = req.query;
  let queryText = `
    SELECT li.*, 
           json_build_object('id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url) as users
    FROM lost_items li
    JOIN users u ON li.user_id = u.id
  `;
  const queryParams = [];
  const conditions = [];

  if (status) {
    queryParams.push(status);
    conditions.push(`li.status = $${queryParams.length}`);
  }

  if (userId) {
    queryParams.push(userId);
    conditions.push(`li.user_id = $${queryParams.length}`);
  }

  if (campus) {
    queryParams.push(campus);
    conditions.push(`li.campus = $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    conditions.push(`(li.title ILIKE $${queryParams.length} OR li.description ILIKE $${queryParams.length} OR li.location ILIKE $${queryParams.length})`);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY li.created_at DESC';

  try {
    const result = await db.query(queryText, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get Items Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data barang.' });
  }
};

// Get single item by ID
exports.getItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const queryText = `
      SELECT li.*, 
             json_build_object('id', u.id, 'full_name', u.full_name, 'avatar_url', u.avatar_url) as users
      FROM lost_items li
      JOIN users u ON li.user_id = u.id
      WHERE li.id = $1
    `;
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get Item By ID Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil detail barang.' });
  }
};

// Create new item report
exports.createItem = async (req, res) => {
  const { title, description, location, date_lost, time_lost, category, image_url, status, campus } = req.body;
  const userId = req.user.id; // From authMiddleware

  if (!title) {
    return res.status(400).json({ message: 'Judul barang wajib diisi.' });
  }

  try {
    const queryText = `
      INSERT INTO lost_items (user_id, title, description, location, date_lost, time_lost, category, image_url, status, campus)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      userId,
      title,
      description || null,
      location || null,
      date_lost || null,
      time_lost || null,
      category || null,
      image_url || null,
      status || 'lost',
      campus || 'UIN Suska Riau'
    ];
    const result = await db.query(queryText, values);

    res.status(201).json({
      message: 'Laporan barang berhasil dibuat!',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Create Item Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat laporan barang.' });
  }
};

// Update item report
exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { title, description, location, date_lost, time_lost, category, image_url, status, campus } = req.body;
  const userId = req.user.id;

  try {
    // Check ownership first
    const checkQuery = 'SELECT * FROM lost_items WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    }

    const existing = checkResult.rows[0];

    if (existing.user_id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak. Anda bukan pemilik laporan ini.' });
    }

    const queryText = `
      UPDATE lost_items
      SET title = $1,
          description = $2,
          location = $3,
          date_lost = $4,
          time_lost = $5,
          category = $6,
          image_url = $7,
          status = $8,
          campus = $9
      WHERE id = $10
      RETURNING *
    `;
    const values = [
      title !== undefined ? title : existing.title,
      description !== undefined ? description : existing.description,
      location !== undefined ? location : existing.location,
      date_lost !== undefined ? date_lost : existing.date_lost,
      time_lost !== undefined ? time_lost : existing.time_lost,
      category !== undefined ? category : existing.category,
      image_url !== undefined ? image_url : existing.image_url,
      status !== undefined ? status : existing.status,
      campus !== undefined ? campus : existing.campus,
      id
    ];
    const result = await db.query(queryText, values);

    res.status(200).json({
      message: 'Laporan barang berhasil diperbarui!',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Update Item Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui laporan barang.' });
  }
};


// Delete item report
exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check ownership
    const checkQuery = 'SELECT user_id FROM lost_items WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Barang tidak ditemukan.' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak. Anda bukan pemilik laporan ini.' });
    }

    const deleteQuery = 'DELETE FROM lost_items WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.status(200).json({ message: 'Laporan barang berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Item Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghapus laporan barang.' });
  }
};
