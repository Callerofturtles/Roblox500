const { getUser, addTokens, spendTokens, run } = require('../database/db');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { safeJSON } = require('../utils/helpers');

function getBalance(userId) {
  return getUser(userId).tokens || 0;
}

function giveDailyReward(userId) {
  const user = getUser(userId);
  const now = Math.floor(Date.now() / 1000);
  if (now - (user.last_daily || 0) < 86400) return { success: false, remaining: 86400 - (now - user.last_daily) };
  addTokens(userId, config.economy.daily);
  run('UPDATE users SET last_daily = ? WHERE id = ?', [now, userId]);
  return { success: true, amount: config.economy.daily };
}

function giveWeeklyReward(userId) {
  const user = getUser(userId);
  const now = Math.floor(Date.now() / 1000);
  if (now - (user.last_weekly || 0) < 604800) return { success: false, remaining: 604800 - (now - user.last_weekly) };
  addTokens(userId, config.economy.weekly);
  run('UPDATE users SET last_weekly = ? WHERE id = ?', [now, userId]);
  return { success: true, amount: config.economy.weekly };
}

function buyItem(userId, itemId) {
  const item = config.shop.find(i => i.id === itemId);
  if (!item) return { success: false, reason: 'Item not found' };
  const inventory = safeJSON(getUser(userId).inventory || '[]');
  if (inventory.includes(itemId)) return { success: false, reason: 'Already owned' };
  if (!spendTokens(userId, item.price)) return { success: false, reason: 'Insufficient tokens' };
  inventory.push(itemId);
  run('UPDATE users SET inventory = ? WHERE id = ?', [JSON.stringify(inventory), userId]);
  return { success: true, item };
}

function buildShopEmbed() {
  const embed = new EmbedBuilder()
    .setColor(config.colors.accent).setTitle('🛒 Token Shop')
    .setDescription('Spend your tokens on exclusive items!');
  const grouped = {};
  for (const item of config.shop) {
    if (!grouped[item.type]) grouped[item.type] = [];
    grouped[item.type].push(item);
  }
  for (const [type, items] of Object.entries(grouped)) {
    const label = { badge: '🎖️ Badges', perk: '⚡ Perks', color: '🎨 Name Colors' }[type] || type;
    embed.addFields({ name: label, value: items.map(i => `**${i.name}** — ${i.price} tokens (\`/buy ${i.id}\`)`).join('\n') });
  }
  embed.setFooter({ text: 'Use /buy <item_id> to purchase • /balance to check tokens' });
  return embed;
}

module.exports = { getBalance, giveDailyReward, giveWeeklyReward, buyItem, buildShopEmbed };
