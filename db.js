const mysql = require('mysql2');

// Ganti sesuai setting database kamu
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // kosong kalau pakai default Laragon
  database: 'kamus_istilah' // ganti dengan nama database kamu
});

connection.connect((err) => {
  if (err) {
    console.error(' Koneksi ke MySQL gagal:', err.stack);
    return;
  }
  console.log(' Berhasil terhubung ke database MySQL!');
});

module.exports = connection;
