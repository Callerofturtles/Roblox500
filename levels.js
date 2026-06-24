const config = require('../config');
const { getUser, addXP, run } = require('../database/db');

function xpForLevel(level) {
  return config.levels.xpFormula(level);
}

function getLevelFromXp(totalXp) {
  let level = 0;
  let xpUsed = 0;
  while (true) {
    const needed = xpForLevel(level);
    if (xpUsed + needed > totalXp) break;
    xpUsed += needed;
    level++;
  }
  return { level, xpIntoLevel: totalXp - xpUsed, xpNeeded: xpForLevel(level) };
}

async function grantXP(userId, amount, guild) {
  const now = Date.now();
  const user = getUser(userId);
  if (now - (user.last_xp || 0) < config.xp.cooldown) return null;

  const { oldXp, newXp, oldLevel } = addXP(userId, amount);
  run('UPDATE users SET last_xp = ?, messages = messages + 1 WHERE id = ?', [now, userId]);

  const { level: newLevel } = getLevelFromXp(newXp);
  if (newLevel > oldLevel) {
    run('UPDATE users SET level = ? WHERE id = ?', [newLevel, userId]);
    await assignLevelRole(userId, newLevel, guild);
    return { leveledUp: true, newLevel, oldLevel };
  }
  return { leveledUp: false };
}

async function assignLevelRole(userId, level, guild) {
  if (!guild) return;
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    for (const reward of config.levels.roles) {
      if (level >= reward.level) {
        let role = guild.roles.cache.find(r => r.name === reward.name);
        if (!role) role = await guild.roles.create({ name: reward.name, color: reward.color, reason: 'Level reward' });
        await member.roles.add(role).catch(() => {});
      }
    }
  } catch (e) { console.error('[Levels] Role assign error:', e.message); }
}

function getProgress(user) {
  const { level, xpIntoLevel, xpNeeded } = getLevelFromXp(user.xp || 0);
  const percent = Math.floor((xpIntoLevel / xpNeeded) * 100);
  return { level, xpIntoLevel, xpNeeded, percent };
}

module.exports = { xpForLevel, getLevelFromXp, grantXP, assignLevelRole, getProgress };
