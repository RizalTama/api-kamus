const express = require('express');
const session = require('express-session');
const authUser = require('./auth_user');
const db = require('./db');
const { KMPSearch } = require('./kmp');
const app = express();
const port = 3000;

app.use(express.json());

// Konfigurasi session
app.use(session({
  secret: 'rahasia_session_kamu',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware untuk mengecek apakah user sudah login
function authMiddleware(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Anda harus login terlebih dahulu' });
  }
  next();
}

app.use('/auth', authUser); // Endpoint login dan register

// 🛡️ Middleware auth untuk endpoint di bawah ini
app.use(authMiddleware);

app.get('/cek-session', (req, res) => {
  res.json({
    session: req.session,
    user: req.session.user || null
  });
});

// Endpoint dashboard
app.get('/dashboard', (req, res) => {
  res.send(`Halo ${req.session.user.username}, selamat datang di dashboard!`);
});


// Endpoint untuk menampilkan data terms dengan paginasi
app.get('/terms', (req, res) => {
  // Ambil parameter page dan limit dari query string, dengan nilai default
  const page = parseInt(req.query.page) || 1; // Halaman default adalah 1
  const limit = parseInt(req.query.limit) || 2000; // Jumlah data per halaman default adalah 20

  // Hitung offset berdasarkan page dan limit
  const offset = (page - 1) * limit;

  // Query untuk mengambil data dengan limit dan offset
  const sql = 'SELECT * FROM terms LIMIT ? OFFSET ?';
  db.query(sql, [limit, offset], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Query untuk menghitung total jumlah data
    db.query('SELECT COUNT(*) AS count FROM terms', (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

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

// Endpoint untuk menampilkan semua data terms
app.get('/terms/all', (req, res) => {
  const sql = 'SELECT * FROM terms';
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});



// ✅ POST /history → Tambah riwayat pencarian
app.post('/history', (req, res) => {
  const { term_id } = req.body;

  // 🔒 Ambil user_id dari session user yang sedang login
  const user_id = req.session.user?.user_id;

  // Validasi
  if (!term_id) {
    return res.status(400).json({ error: 'term_id wajib diisi' });
  }

  const sql = `INSERT INTO searchhistory (user_id, term_id, search_at) VALUES (?, ?, NOW())`;

  db.query(sql, [user_id, term_id], (err, result) => {
    if (err) {
      console.error('Insert history error:', err);
      return res.status(500).json({ error: 'Gagal menyimpan riwayat pencarian' });
    }

    res.json({
      message: 'Riwayat pencarian berhasil disimpan',
      inserted_id: result.insertId
    });
  });
});


// ✅ GET /history → Ambil semua riwayat user yang login
app.get('/history', (req, res) => {
  const userId = req.session.user?.user_id;

  const sql = `
    SELECT h.history_id, h.user_id, h.term_id, t.term, t.definition, h.search_at
    FROM searchhistory h
    JOIN terms t ON h.term_id = t.term_id
    WHERE h.user_id = ?
    ORDER BY h.search_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Get history error:', err);
      return res.status(500).json({ error: 'Gagal mengambil data riwayat' });
    }

    res.json(results);
  });
});

// ✅ DELETE /history/delete/:id → Hapus satu riwayat
app.delete('/history/delete/:id', (req, res) => {
  const historyId = req.params.id;

  const sql = `DELETE FROM searchhistory WHERE history_id = ?`;
  db.query(sql, [historyId], (err, result) => {
    if (err) {
      console.error('Delete history error:', err);
      return res.status(500).json({ error: 'Gagal menghapus data riwayat' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    }

    res.json({ message: `Riwayat dengan ID ${historyId} berhasil dihapus` });
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('Hello World');
});

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
        // Gunakan KMP untuk memfilter hasil
        const filtered = results.filter(term => {
            return KMPSearch(keyword.toLowerCase(), term.term.toLowerCase()).length > 0;
        });

        res.json(filtered);
    });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
