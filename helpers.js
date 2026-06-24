const moment = require('moment');

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function parseTime(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * map[unit];
}

function parseDateTime(str) {
  const formats = ['YYYY-MM-DD HH:mm', 'MM/DD/YYYY HH:mm', 'HH:mm'];
  const m = moment(str, formats, true);
  if (!m.isValid()) return null;
  if (m.isBefore(moment())) {
    if (str.match(/^\d{2}:\d{2}$/)) m.add(1, 'day');
  }
  return m.unix();
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function truncate(str, len = 100) {
  return str.length > len ? str.slice(0, len - 3) + '...' : str;
}

function getWeekKey() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

function safeJSON(str, fallback = []) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = { formatTime, parseTime, parseDateTime, chunk, randomInt, truncate, getWeekKey, safeJSON };
