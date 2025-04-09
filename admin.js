const express = require('express');
const port = 4000;
const bodyParser = require('body-parser');
const db = require('./db');
const { KMPSearch } = require('./kmp');
const session = require('express-session');
const authAdmin = require('./auth_admin');
const app = express();

app.use(bodyParser.json());

// Session config
app.use(session({
  secret: 'rahasia_admin_session',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use('/admin', authAdmin);

// 🔐 Middleware untuk proteksi akses admin
function adminMiddleware(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.status(401).json({ error: 'Anda harus login sebagai admin terlebih dahulu' });
  }
  next();
}

// Terapkan middleware untuk semua route setelah /admin
app.use(adminMiddleware);

// Cek session
app.get('/cek-session', (req, res) => {
  res.json({
    session: req.session,
    admin: req.session.admin || null
  });
});

// GET terms with pagination
app.get('/terms', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sql = 'SELECT * FROM terms LIMIT ? OFFSET ?';
  db.query(sql, [limit, offset], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query('SELECT COUNT(*) AS count FROM terms', (err, countResult) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalItems = countResult[0].count;
      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        data: results,
        currentPage: page,
        limit: limit,
        totalPages: totalPages,
        totalItems: totalItems,
      });
    });
  });
});

// ✅ POST terms (admin only)
app.post('/terms', (req, res) => {
  let terms = req.body;

  if (!req.session.admin || !req.session.admin.admin_id) {
    return res.status(401).json({ error: 'Anda harus login sebagai admin terlebih dahulu' });
  }

  const adminId = req.session.admin.admin_id;

  // Kalau body-nya bukan array, jadikan array
  if (!Array.isArray(terms)) {
    terms = [terms];
  }

  if (terms.length === 0) {
    return res.status(400).json({ error: 'Data tidak boleh kosong' });
  }

  const isValid = terms.every(item => item.term && item.definition);
  if (!isValid) {
    return res.status(400).json({ error: 'Setiap item harus memiliki term dan definition' });
  }

  const values = terms.map(item => [
    item.term,
    item.definition,
    item.audio_file || null,
    adminId,
    new Date()
  ]);

  const sql = `
    INSERT INTO terms (term, definition, audio_file, admin_id, created_at)
    VALUES ?
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'Gagal menyimpan data' });
    }
    res.json({ message: 'Berhasil menyimpan data terms', inserted: result.affectedRows });
  });
});

// ✅ GET term by ID
app.get('/terms/:id', (req, res) => {
  const termId = req.params.id;
  const sql = `SELECT * FROM terms WHERE term_id = ?`;

  db.query(sql, [termId], (err, result) => {
    if (err) {
      console.error('Read error:', err);
      return res.status(500).json({ error: 'Gagal mengambil data' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json(result[0]);
  });
});
// ✅ UPDATE terms (admin only)
app.put('/terms/:id', (req, res) => {
  if (!req.session.admin || !req.session.admin.admin_id) {
    return res.status(401).json({ error: 'Anda harus login sebagai admin terlebih dahulu' });
  }

  const { id } = req.params;
  const { term, definition, audio_file } = req.body;

  if (!term || !definition) {
    return res.status(400).json({ error: 'Field term dan definition wajib diisi' });
  }

  const sql = `
    UPDATE terms
    SET term = ?, definition = ?, audio_file = ?
    WHERE term_id = ?
  `;

  db.query(sql, [term, definition, audio_file || null, id], (err, result) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: 'Gagal mengupdate data' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Term tidak ditemukan' });
    }
    res.json({ message: 'Berhasil mengupdate data' });
  });
});

// ✅ DELETE terms (admin only)
app.delete('/terms/:id', (req, res) => {
  if (!req.session.admin || !req.session.admin.admin_id) {
    return res.status(401).json({ error: 'Anda harus login sebagai admin terlebih dahulu' });
  }

  const { id } = req.params;

  const sql = `DELETE FROM terms WHERE term_id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Gagal menghapus data' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Term tidak ditemukan' });
    }
    res.json({ message: 'Berhasil menghapus data' });
  });
});


// ✅ Search with KMP (pastikan fungsi KMP sudah tersedia di file ini atau di-include)
app.get('/search', (req, res) => {
  const keyword = req.query.keyword;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword tidak boleh kosong' });
  }

  const sql = `SELECT * FROM terms`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Search error:', err);
      return res.status(500).json({ error: 'Gagal melakukan pencarian' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Tidak ada data ditemukan' });
    }
 
    const filtered = results.filter(term => {
      return KMPSearch(keyword.toLowerCase(), term.term.toLowerCase()).length > 0;
    });
  
    res.json(filtered);
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
