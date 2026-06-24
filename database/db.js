const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Keep data in repository's ./data by default (database/../data) but fall back to repo-root bot.db
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
let dbPath = path.join(dbDir, 'bot.db');
// If there is an existing bot.db at the repository root (e.g. ./bot.db), prefer that file to preserve data
const fallbackRootDb = path.join(__dirname, '../bot.db');
if (!fs.existsSync(dbPath) && fs.existsSync(fallbackRootDb)) {
  dbPath = fallbackRootDb;
}

let db;

async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Save DB to disk on changes
  function save() {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }

  // Auto-save every 30 seconds and on process exit
  setInterval(save, 30000);
  process.on('exit', save);
  process.on('SIGINT', () => { save(); process.exit(0); });
  process.on('SIGTERM', () => { save(); process.exit(0); });

  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      tokens INTEGER DEFAULT 0,
      messages INTEGER DEFAULT 0,
      voice_minutes INTEGER DEFAULT 0,
      last_xp INTEGER DEFAULT 0,
      last_daily INTEGER DEFAULT 0,
      last_weekly INTEGER DEFAULT 0,
      roblox_username TEXT,
      roblox_verified INTEGER DEFAULT 0,
      reputation INTEGER DEFAULT 0,
      rep_given INTEGER DEFAULT 0,
      last_rep INTEGER DEFAULT 0,
      badges TEXT DEFAULT '[]',
      inventory TEXT DEFAULT '[]',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      specialties TEXT DEFAULT '[]',
      years_exp INTEGER DEFAULT 0,
      portfolio TEXT DEFAULT '',
      roblox_username TEXT DEFAULT '',
      favorite_genre TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      sessions_completed INTEGER DEFAULT 0,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS invite_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id TEXT,
      invitee_id TEXT,
      joined_at INTEGER DEFAULT (strftime('%s','now')),
      left INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS invites (
      invite_code TEXT PRIMARY KEY,
      inviter_id TEXT,
      uses INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id TEXT,
      game_name TEXT,
      roblox_link TEXT,
      player_requirement INTEGER DEFAULT 5,
      start_time INTEGER,
      duration INTEGER DEFAULT 60,
      reward TEXT DEFAULT '',
      age_requirement INTEGER DEFAULT 16,
      vc_required INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open',
      channel_id TEXT,
      message_id TEXT,
      participants TEXT DEFAULT '[]',
      attended TEXT DEFAULT '[]',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submitter_id TEXT,
      game_name TEXT,
      roblox_link TEXT,
      description TEXT,
      genre TEXT,
      votes_up INTEGER DEFAULT 0,
      votes_down INTEGER DEFAULT 0,
      voters TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0,
      message_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      type TEXT,
      channel_id TEXT,
      status TEXT DEFAULT 'open',
      transcript TEXT DEFAULT '',
      created_at INTEGER DEFAULT (strftime('%s','now')),
      closed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS moderation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      guild_id TEXT,
      mod_id TEXT,
      action TEXT,
      reason TEXT,
      duration INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      guild_id TEXT,
      mod_id TEXT,
      reason TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS reputation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT,
      to_id TEXT,
      session_id INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id TEXT,
      name TEXT,
      description TEXT,
      type TEXT DEFAULT 'general',
      start_time INTEGER,
      end_time INTEGER,
      reward TEXT DEFAULT '',
      participants TEXT DEFAULT '[]',
      status TEXT DEFAULT 'upcoming',
      message_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS matchmaking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      role TEXT,
      description TEXT,
      skills TEXT DEFAULT '[]',
      active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id TEXT,
      channel_id TEXT,
      message_id TEXT,
      prize TEXT,
      winners_count INTEGER DEFAULT 1,
      entries TEXT DEFAULT '[]',
      end_time INTEGER,
      ended INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      content TEXT,
      message_id TEXT,
      votes_up INTEGER DEFAULT 0,
      votes_down INTEGER DEFAULT 0,
      voters TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id TEXT,
      question TEXT,
      options TEXT,
      votes TEXT DEFAULT '{}',
      end_time INTEGER,
      ended INTEGER DEFAULT 0,
      message_id TEXT,
      channel_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS temp_vc (
      channel_id TEXT PRIMARY KEY,
      owner_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );

    CREATE TABLE IF NOT EXISTS guild_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS queue_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      place_id TEXT,
      game_name TEXT,
      game_link TEXT,
      players_needed INTEGER DEFAULT 5,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      session_id INTEGER,
      queue_points INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);

  save();
  console.log('[DB] Database initialized successfully');
  return { save };
}

// ── Low-level helpers ───────────────────────────────────────────────────────
function run(sql, params = []) {
  db.run(sql, params);
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function lastInsertId() {
  const row = get('SELECT last_insert_rowid() as id');
  return row ? row.id : null;
}

// ── User helpers ──────────────────────────────────────────────────────────
function getUser(userId) {
  let user = get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    run('INSERT OR IGNORE INTO users (id) VALUES (?)', [userId]);
    user = get('SELECT * FROM users WHERE id = ?', [userId]);
  }
  return user;
}

function updateUser(userId, fields) {
  const keys = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(fields), userId];
  run(`UPDATE users SET ${keys} WHERE id = ?`, vals);
}

function addXP(userId, amount) {
  const user = getUser(userId);
  const newXp = (user.xp || 0) + amount;
  run('UPDATE users SET xp = xp + ? WHERE id = ?', [amount, userId]);
  return { oldXp: user.xp || 0, newXp, oldLevel: user.level || 0 };
}

function addTokens(userId, amount) {
  run('UPDATE users SET tokens = tokens + ? WHERE id = ?', [amount, userId]);
}

function spendTokens(userId, amount) {
  const user = getUser(userId);
  if ((user.tokens || 0) < amount) return false;
  run('UPDATE users SET tokens = tokens - ? WHERE id = ?', [amount, userId]);
  return true;
}

function getLeaderboard(type = 'xp', limit = 10) {
  if (type === 'tokens') return all('SELECT * FROM users ORDER BY tokens DESC LIMIT ?', [limit]);
  if (type === 'invites') {
    return all(`
      SELECT inviter_id, COUNT(*) as invite_count
      FROM invite_tracking WHERE left = 0
      GROUP BY inviter_id ORDER BY invite_count DESC LIMIT ?
    `, [limit]);
  }
  return all('SELECT * FROM users ORDER BY xp DESC LIMIT ?', [limit]);
}

module.exports = {
  init,
  run,
  get,
  all,
  lastInsertId,
  getUser,
  updateUser,
  addXP,
  addTokens,
  spendTokens,
  getLeaderboard,
};
