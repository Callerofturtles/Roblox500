const express = require('express');
const db = require('./database/db'); // use helper functions: db.get, db.all, etc.
const config = require('./config');

const app = express();
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Simple auth middleware
app.use('/api', (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== config.dashboard.secret) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

app.get('/api/stats', (req, res) => {
  const users = (db.get('SELECT COUNT(*) as cnt FROM users') || {}).cnt || 0;
  const sessions = (db.get('SELECT COUNT(*) as cnt FROM sessions') || {}).cnt || 0;
  const activeSessions = (db.get('SELECT COUNT(*) as cnt FROM sessions WHERE status = ?', ['open']) || {}).cnt || 0;
  const tickets = (db.get('SELECT COUNT(*) as cnt FROM tickets WHERE status = ?', ['open']) || {}).cnt || 0;
  const topUsers = db.all('SELECT id, xp, level, tokens FROM users ORDER BY xp DESC LIMIT 5');
  res.json({ users, sessions, activeSessions, tickets, topUsers });
});

app.get('/api/sessions', (req, res) => {
  const sessions = db.all('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 20');
  res.json(sessions);
});

app.get('/api/modlogs', (req, res) => {
  const logs = db.all('SELECT * FROM moderation ORDER BY created_at DESC LIMIT 50');
  res.json(logs);
});

app.get('/api/games', (req, res) => {
  const games = db.all('SELECT * FROM games ORDER BY votes_up DESC LIMIT 20');
  res.json(games);
});

app.get('/api/leaderboard', (req, res) => {
  const users = db.all('SELECT id, xp, level, tokens FROM users ORDER BY xp DESC LIMIT 20');
  res.json(users);
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roblox Launch Network — Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0d0d1a; color: #e0e0e0; min-height: 100vh; }
    header { background: #1a1a2e; border-bottom: 2px solid #00d4ff; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
    header h1 { color: #00d4ff; font-size: 1.5rem; }
    header span { color: #dc143c; font-size: 1.2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 2rem; }
    .card { background: #1a1a2e; border: 1px solid #333; border-radius: 12px; padding: 1.5rem; text-align: center; }
    .card .value { font-size: 2.5rem; font-weight: bold; color: #00d4ff; }
    .card .label { color: #888; margin-top: 0.5rem; }
    .section { padding: 0 2rem 2rem; }
    .section h2 { color: #00d4ff; margin-bottom: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #111; color: #00d4ff; padding: 0.75rem; text-align: left; }
    td { padding: 0.75rem; border-bottom: 1px solid #222; }
    tr:hover { background: #1f1f35; }
    .badge { background: #dc143c; color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; }
    .footer { text-align: center; padding: 2rem; color: #444; }
  </style>
</head>
<body>
  <header>
    <span>🩸</span>
    <h1>Roblox Launch Network — Bot Dashboard</h1>
  </header>
  <div class="grid" id="stats">
    <div class="card"><div class="value" id="s-users">...</div><div class="label">Total Users</div></div>
    <div class="card"><div class="value" id="s-sessions">...</div><div class="label">Total Sessions</div></div>
    <div class="card"><div class="value" id="s-active">...</div><div class="label">Active Sessions</div></div>
    <div class="card"><div class="value" id="s-tickets">...</div><div class="label">Open Tickets</div></div>
  </div>
  <div class="section">
    <h2>🏆 Top Users (by XP)</h2>
    <table><thead><tr><th>Rank</th><th>User ID</th><th>Level</th><th>XP</th><th>Tokens</th></tr></thead>
    <tbody id="leaderboard"></tbody></table>
  </div>
  <div class="section">
    <h2>🎮 Recent Sessions</h2>
    <table><thead><tr><th>ID</th><th>Game</th><th>Host</th><th>Status</th><th>Players</th></tr></thead>
    <tbody id="sessions"></tbody></table>
  </div>
  <div class="footer">Roblox Launch Network Bot Dashboard • Powered by discord.js v14</div>
  <script>
    const API_KEY = prompt('Enter Dashboard API Key:');
    const headers = { 'x-api-key': API_KEY };
    async function load() {
      const s = await fetch('/api/stats', { headers }).then(r => r.json()).catch(() => ({}));
      document.getElementById('s-users').textContent = s.users ?? '?';
      document.getElementById('s-sessions').textContent = s.sessions ?? '?';
      document.getElementById('s-active').textContent = s.activeSessions ?? '?';
      document.getElementById('s-tickets').textContent = s.tickets ?? '?';
      const lb = await fetch('/api/leaderboard', { headers }).then(r => r.json()).catch(() => []);
      document.getElementById('leaderboard').innerHTML = lb.map((u, i) =>
        '<tr><td>' + (i+1) + '</td><td><code>' + u.id + '</code></td><td>' + u.level + '</td><td>' + u.xp + '</td><td>' + u.tokens + '</td></tr>'
      ).join('');
      const sess = await fetch('/api/sessions', { headers }).then(r => r.json()).catch(() => []);
      document.getElementById('sessions').innerHTML = sess.map(s => {
        const p = JSON.parse(s.participants || '[]').length;
        const badge = s.status === 'open' ? '<span class="badge">OPEN</span>' : s.status;
        return '<tr><td>#' + s.id + '</td><td>' + s.game_name + '</td><td>' + s.host_id + '</td><td>' + badge + '</td><td>' + p + '/' + s.player_requirement + '</td></tr>';
      }).join('');
    }
    load(); setInterval(load, 30000);
  </script>
</body>
</html>
  `);
});

function startDashboard() {
  const port = parseInt(process.env.PORT) || config.dashboard.port;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Dashboard] Running on port ${port}`);
  });
}

module.exports = { startDashboard };
