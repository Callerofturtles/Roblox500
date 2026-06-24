const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { run, get, all, addXP, addTokens } = require('../database/db');
const { sessionEmbed } = require('../utils/embeds');
const config = require('../config');

const sessionReminders = new Map();

async function createSession(interaction, options) {
  const { gameName, robloxLink, playerReq, startTime, duration, reward, ageReq, vcRequired } = options;

  run(`INSERT INTO sessions (host_id, game_name, roblox_link, player_requirement, start_time, duration, reward, age_requirement, vc_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [interaction.user.id, gameName, robloxLink, playerReq, startTime, duration, reward, ageReq, vcRequired ? 1 : 0]);

  const { lastInsertId } = require('../database/db');
  const sessionId = lastInsertId();
  const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  const embed = sessionEmbed(session, interaction.user);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`session_join_${sessionId}`).setLabel('✅ Join Session').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`session_leave_${sessionId}`).setLabel('❌ Leave Session').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`session_info_${sessionId}`).setLabel('ℹ️ Info').setStyle(ButtonStyle.Secondary),
  );

  const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  run('UPDATE sessions SET message_id = ?, channel_id = ? WHERE id = ?', [msg.id, interaction.channelId, sessionId]);
  scheduleReminders(interaction.client, sessionId, startTime, interaction.channelId);
  return sessionId;
}

function scheduleReminders(client, sessionId, startTime, channelId) {
  for (const mins of config.sessionDefaults.reminderMinutes) {
    const delay = (startTime * 1000) - Date.now() - (mins * 60000);
    if (delay <= 0) continue;
    const t = setTimeout(async () => {
      const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session || session.status !== 'open') return;
      const participants = JSON.parse(session.participants || '[]');
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) return;
      const pings = participants.map(id => `<@${id}>`).join(' ');
      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`⏰ Session Reminder: ${session.game_name}`)
        .setDescription(`Starts in **${mins} minute${mins > 1 ? 's' : ''}**!\n${pings || 'No participants yet'}`)
        .setTimestamp();
      channel.send({ content: pings || undefined, embeds: [embed] }).catch(() => {});
    }, delay);
    sessionReminders.set(`${sessionId}_${mins}`, t);
  }
}

async function joinSession(interaction, sessionId) {
  const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!session) return interaction.reply({ content: '❌ Session not found.', ephemeral: true });
  if (session.status !== 'open') return interaction.reply({ content: '❌ This session is not open.', ephemeral: true });
  const participants = JSON.parse(session.participants || '[]');
  if (participants.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ Already in this session.', ephemeral: true });
  if (participants.length >= session.player_requirement) return interaction.reply({ content: '❌ Session is full.', ephemeral: true });
  participants.push(interaction.user.id);
  run('UPDATE sessions SET participants = ? WHERE id = ?', [JSON.stringify(participants), sessionId]);
  return interaction.reply({ content: `✅ Joined **${session.game_name}**! Starts <t:${session.start_time}:R>.`, ephemeral: true });
}

async function leaveSession(interaction, sessionId) {
  const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!session) return interaction.reply({ content: '❌ Session not found.', ephemeral: true });
  let participants = JSON.parse(session.participants || '[]');
  if (!participants.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ Not in this session.', ephemeral: true });
  participants = participants.filter(id => id !== interaction.user.id);
  run('UPDATE sessions SET participants = ? WHERE id = ?', [JSON.stringify(participants), sessionId]);
  return interaction.reply({ content: `✅ Left **${session.game_name}**.`, ephemeral: true });
}

async function endSession(sessionId, client) {
  const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!session) return;
  const attended = JSON.parse(session.attended || '[]');
  for (const uid of attended) {
    addXP(uid, config.xp.session_attend);
    addTokens(uid, config.economy.session);
    run('INSERT OR IGNORE INTO profiles (user_id) VALUES (?)', [uid]);
    run('UPDATE profiles SET sessions_completed = sessions_completed + 1 WHERE user_id = ?', [uid]);
  }
  run('UPDATE sessions SET status = ? WHERE id = ?', ['closed', sessionId]);
  if (session.channel_id && session.message_id) {
    const channel = await client.channels.fetch(session.channel_id).catch(() => null);
    if (channel) {
      const msg = await channel.messages.fetch(session.message_id).catch(() => null);
      if (msg) {
        const embed = sessionEmbed({ ...session, status: 'closed' }, null);
        msg.edit({ embeds: [embed], components: [] }).catch(() => {});
      }
    }
  }
}

module.exports = { createSession, joinSession, leaveSession, endSession, scheduleReminders };
