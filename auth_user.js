const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');

// Route untuk register dengan insert ke database
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Semua field harus diisi' });
  }

  const checkSql = `SELECT * FROM user WHERE email = ? LIMIT 1`;
  db.query(checkSql, [email], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error cek email:', checkErr);
      return res.status(500).json({ error: 'Terjadi kesalahan saat memeriksa email' });
    }

    if (checkResult.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const insertSql = `INSERT INTO user (username, password, email, created_at) VALUES (?, ?, ?, NOW())`;
    db.query(insertSql, [username, hashedPassword, email], (insertErr, result) => {
      if (insertErr) {
        console.error('Insert error:', insertErr);
        return res.status(500).json({ error: 'Gagal mendaftarkan user' });
      }

      res.status(201).json({
        message: 'Registrasi berhasil',
        user_id: result.insertId,
        username,
        email
      });
    });
  });
});

// Endpoint untuk login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const sql = `SELECT * FROM user WHERE email = ? LIMIT 1`;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ error: 'Gagal mengambil data user' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Email tidak ditemukan' });
    }

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Password salah' });
    }

    // ✅ Simpan user ke session dengan key 'user_id' (agar cocok dengan app.js)
    req.session.user = {
      user_id: user.user_id,
      email: user.email,
      username: user.username
    };

    res.json({ message: 'Login berhasil', user: req.session.user });
  });
});

// Endpoint untuk logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Gagal logout' });
    }
    res.json({ message: 'Logout berhasil' });
  });
});

module.exports = router;
