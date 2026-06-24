const { EmbedBuilder } = require('discord.js');
const { grantXP, getProgress } = require('../utils/levels');
const { getUser, run } = require('../database/db');
const config = require('../config');
const { randomInt } = require('../utils/helpers');

const voiceMembers = new Map();

async function handleMessage(message) {
  if (message.author.bot || !message.guild) return;
  const amount = randomInt(config.xp.message.min, config.xp.message.max);
  const result = await grantXP(message.author.id, amount, message.guild);
  if (!result) return;

  if (result.leveledUp) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle('🎉 Level Up!')
      .setDescription(`<@${message.author.id}> reached **Level ${result.newLevel}**!`)
      .setThumbnail(message.author.displayAvatarURL())
      .setTimestamp();
    const reward = config.levels.roles.find(r => r.level === result.newLevel);
    if (reward) embed.addFields({ name: '🎖️ Role Reward', value: reward.name });
    message.channel.send({ embeds: [embed] }).catch(() => {});
  }
}

function handleVoiceJoin(userId) {
  voiceMembers.set(userId, Date.now());
}

async function handleVoiceLeave(userId, guild) {
  const joinTime = voiceMembers.get(userId);
  if (!joinTime) return;
  voiceMembers.delete(userId);
  const minutes = Math.floor((Date.now() - joinTime) / 60000);
  if (minutes < 1) return;
  run('UPDATE users SET voice_minutes = voice_minutes + ? WHERE id = ?', [minutes, userId]);
  await grantXP(userId, minutes * config.xp.voice, guild).catch(() => {});
}

module.exports = { handleMessage, handleVoiceJoin, handleVoiceLeave };
