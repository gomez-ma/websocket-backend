const express = require('express');
const cors = require('cors');
const pool = require('./db');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const server = app.listen(4000, () =>
  console.log('Server running on port 4000')
);

// WebSocket Server
const wss = new WebSocket.Server({ server });

const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// READ
app.get('/items', async (req, res) => {
  const result = await pool.query('SELECT * FROM items ORDER BY id');
  res.json(result.rows);
});

// CREATE
app.post('/items', async (req, res) => {
  const { name } = req.body;
  const result = await pool.query(
    'INSERT INTO items(name) VALUES($1) RETURNING *',
    [name]
  );

  broadcast({ type: 'INSERT', data: result.rows[0] });
  res.json(result.rows[0]);
});

// UPDATE
app.put('/items/:id', async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  const result = await pool.query(
    'UPDATE items SET name=$1 WHERE id=$2 RETURNING *',
    [name, id]
  );

  broadcast({ type: 'UPDATE', data: result.rows[0] });
  res.json(result.rows[0]);
});

// DELETE
app.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM items WHERE id=$1', [id]);

  broadcast({ type: 'DELETE', id: Number(id) });
  res.json({ success: true });
});
