const express = require('express');
const port = 3000;
const bodyParser = require('body-parser');
const db = require('./db');
const session = require('express-session');
const authAdmin = require('./auth_admin');
const app = express();

app.use(bodyParser.json());
//Session config
app.use(session({
  secret: 'rahasia_admin_session',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(bodyParser.json());

app.use('/auth', authAdmin);

// 🔐 Middleware untuk proteksi akses admin
function authMiddleware(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Anda harus login sebagai admin terlebih dahulu' });
  }
  next();
}

// Terapkan middleware untuk semua route setelah /auth
app.use(authMiddleware);

//Endpoint untuk menempilkan semua data terms
app.get('/terms', (req, res) => {
    db.query('SELECT * FROM terms', (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  });
  
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

// Endpoint untuk  insert 
app.post('/terms/insert', (req, res) => {
  const terms = req.body;

  if (!Array.isArray(terms) || terms.length === 0) {
    return res.status(400).json({ error: 'Data harus berupa array dan tidak boleh kosong' });
  }

  // Validasi tiap item harus punya admin_id
  const isValid = terms.every(item => item.term && item.definition && item.admin_id);
  if (!isValid) {
    return res.status(400).json({ error: 'Semua item harus memiliki term, definition, dan admin_id' });
  }
  
  const values = terms.map(item => [
    item.term,
    item.definition,
    item.audio_file || null,
    item.admin_id
  ]);

  const sql = `
    INSERT INTO terms (term, definition, audio_file, admin_id)
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

// Endpoint untuk delete data terms berdasarkan term_id
app.delete('/terms/delete/:id', (req, res) => {
  const id = req.params.id;

  const sql = `DELETE FROM terms WHERE term_id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Gagal menghapus data' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    res.json({ message: `Berhasil menghapus term dengan id ${id}` });
  });
});

// Endpoint untuk update data terms berdasarkan term_id
app.put('/terms/update/:id', (req, res) => {
  const termId = req.params.id;
  const { term, definition, audio_file, admin_id } = req.body;

  // Validasi input
  if (!term || !definition || !admin_id) {
    return res.status(400).json({ error: 'Field term, definition, dan admin_id wajib diisi' });
  }

  const sql = `
    UPDATE terms 
    SET term = ?, definition = ?, audio_file = ?, admin_id = ?
    WHERE term_id = ?
  `;

  db.query(sql, [term, definition, audio_file || null, admin_id, termId], (err, result) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: 'Gagal mengupdate data' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Data dengan term_id tersebut tidak ditemukan' });
    }

    res.json({ message: `Berhasil mengupdate term dengan id ${termId}` });
  });
});

// Endpoint untuk membaca data terms berdasarkan term_id
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

    res.json(result[0]); // Kirim satu objek saja
  });
});

