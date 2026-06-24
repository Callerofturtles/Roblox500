const { run } = require('../database/db');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const messageLog = new Map();
const warnCount = new Map();

async function check(message) {
  if (message.author.bot || !message.guild) return;
  if (message.member?.permissions.has(8n)) return;

  const userId = message.author.id;
  const content = message.content.toLowerCase();
  const now = Date.now();

  const log = messageLog.get(userId) || [];
  const recent = log.filter(t => now - t < config.automod.spamWindow);
  recent.push(now);
  messageLog.set(userId, recent);

  if (recent.length >= config.automod.spamMessages) {
    await punish(message, userId, 'Sending messages too fast');
    messageLog.set(userId, []);
    return;
  }

  for (const word of config.automod.badWords) {
    if (content.includes(word)) {
      await message.delete().catch(() => {});
      await punish(message, userId, 'Using prohibited language');
      return;
    }
  }

  const links = (content.match(/https?:\/\/[^\s]+/gi) || []);
  const badLinks = links.filter(l => !config.automod.allowedLinks.some(al => l.includes(al)));
  if (badLinks.length > config.automod.maxLinks) {
    await message.delete().catch(() => {});
    await punish(message, userId, 'Posting too many links');
    return;
  }

  if (message.mentions.users.size + message.mentions.roles.size > config.automod.maxMentions) {
    await message.delete().catch(() => {});
    await punish(message, userId, 'Mass mentions');
  }
}

async function punish(message, userId, reason) {
  const warns = (warnCount.get(userId) || 0) + 1;
  warnCount.set(userId, warns);
  run('INSERT INTO warnings (user_id, guild_id, mod_id, reason) VALUES (?, ?, ?, ?)',
    [userId, message.guild.id, message.client.user.id, `[AutoMod] ${reason}`]);

  const embed = new EmbedBuilder()
    .setColor(config.colors.warning).setTitle('⚠️ AutoMod Action')
    .setDescription(`<@${userId}> was flagged: **${reason}** (Warning ${warns})`)
    .setTimestamp();

  await message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(() => {}), 8000));

  if (warns >= config.automod.banThreshold) {
    await message.member?.ban({ reason: `[AutoMod] ${reason}` }).catch(() => {});
  } else if (warns >= config.automod.muteThreshold) {
    await message.member?.timeout(600000, `[AutoMod] ${reason}`).catch(() => {});
  }
}

module.exports = { check };
