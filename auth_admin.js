const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'rahasia_kamu';

// Route untuk register dengan insert ke database
router.post('/register/admin', (req, res) => {
    const { username, password, email } = req.body;
  
    // Validasi input
    if (!username || !password ) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }
  
    // Cek apakah email sudah digunakan
    const checkSql = `SELECT * FROM admin WHERE email = ? LIMIT 1`;
    db.query(checkSql, [email], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('Error cek email:', checkErr);
        return res.status(500).json({ error: 'Terjadi kesalahan saat memeriksa email' });
      }
  
      if (checkResult.length > 0) {
        return res.status(409).json({ error: 'Email sudah terdaftar' });
      }
  
      // Hash password
      const hashedPassword = bcrypt.hashSync(password, 10);
  
      // Insert user baru
      const insertSql = `INSERT INTO admin (username, password, email, created_at) VALUES (?, ?, ?, NOW())`;
      db.query(insertSql, [username, hashedPassword, email], (insertErr, result) => {
        if (insertErr) {
          console.error('Insert error:', insertErr);
          return res.status(500).json({ error: 'Gagal mendaftarkan admin' });
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
  router.post('/login/admin', (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }
  
    const sql = `SELECT * FROM admin WHERE email = ? LIMIT 1`;
  
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
  
      // Simpan data user ke session
      req.session.user = {
        user_id: user.id,
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
