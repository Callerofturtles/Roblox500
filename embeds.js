const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function base(title, description, color = config.colors.accent) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Roblox Launch Network' });
}

function success(title, description) {
  return base(title, description, config.colors.success);
}

function error(title, description) {
  return base(title, description, config.colors.danger);
}

function warning(title, description) {
  return base(title, description, config.colors.warning);
}

function horror(title, description) {
  return base(title, description, config.colors.horror)
    .setFooter({ text: '🩸 Roblox Launch Network' });
}

function profile(user, dbUser, dbProfile) {
  const badges = JSON.parse(dbUser.badges || '[]');
  const specialties = JSON.parse(dbProfile?.specialties || '[]');
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`👤 ${user.username}'s Profile`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { name: '🎮 Roblox', value: dbUser.roblox_username || 'Not set', inline: true },
      { name: '✅ Verified', value: dbUser.roblox_verified ? '✅ Yes' : '❌ No', inline: true },
      { name: '⭐ Reputation', value: `${dbUser.reputation}`, inline: true },
      { name: '🏆 Level', value: `${dbUser.level}`, inline: true },
      { name: '💰 Tokens', value: `${dbUser.tokens}`, inline: true },
      { name: '📋 Sessions', value: `${dbProfile?.sessions_completed || 0}`, inline: true },
      { name: '🛠️ Specialties', value: specialties.length ? specialties.join(', ') : 'None set', inline: false },
      { name: '📁 Portfolio', value: dbProfile?.portfolio || 'Not set', inline: false },
      { name: '🎖️ Badges', value: badges.length ? badges.join(' ') : 'None', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: 'Roblox Launch Network' });
}

function rankCard(user, dbUser, xpNeeded, progress) {
  const bar = createProgressBar(progress);
  return new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle(`📊 ${user.username}'s Rank`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🏆 Level', value: `**${dbUser.level}**`, inline: true },
      { name: '✨ XP', value: `**${dbUser.xp}** / ${xpNeeded}`, inline: true },
      { name: '💬 Messages', value: `**${dbUser.messages}**`, inline: true },
      { name: '🎙️ Voice Minutes', value: `**${dbUser.voice_minutes}**`, inline: true },
      { name: '💰 Tokens', value: `**${dbUser.tokens}**`, inline: true },
      { name: '⭐ Reputation', value: `**${dbUser.reputation}**`, inline: true },
      { name: '📈 Progress', value: `${bar} ${progress}%`, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: 'Roblox Launch Network' });
}

function sessionEmbed(session, host) {
  const status = {
    open: '🟢 Open',
    active: '🔵 In Progress',
    closed: '🔴 Closed',
    cancelled: '⚫ Cancelled',
  }[session.status] || session.status;

  const participants = JSON.parse(session.participants || '[]');
  const startTime = Math.floor(session.start_time);

  return new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle(`🎮 Testing Session: ${session.game_name}`)
    .setDescription(`Hosted by <@${session.host_id}>`)
    .addFields(
      { name: '🔗 Roblox Link', value: `[Click to Join](${session.roblox_link})`, inline: true },
      { name: '👥 Players', value: `${participants.length}/${session.player_requirement}`, inline: true },
      { name: '📅 Start Time', value: `<t:${startTime}:F>`, inline: true },
      { name: '⏱️ Duration', value: `${session.duration} minutes`, inline: true },
      { name: '🎁 Reward', value: session.reward || 'None', inline: true },
      { name: '🔞 Age Req.', value: `${session.age_requirement}+`, inline: true },
      { name: '🎙️ VC Required', value: session.vc_required ? '✅ Yes' : '❌ No', inline: true },
      { name: '📊 Status', value: status, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'Roblox Launch Network • /session join to participate' });
}

function createProgressBar(percent, length = 20) {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\``;
}

module.exports = { base, success, error, warning, horror, profile, rankCard, sessionEmbed, createProgressBar };
