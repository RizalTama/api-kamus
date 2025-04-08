const express = require('express');
const app = express();
const port = 3000;
const db = require('./db'); // import koneksi


app.get('/', (req, res) => {
  res.send('Halo dunia dari Express!');
});

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
