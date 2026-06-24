const { get, run, all } = require('../database/db');
const { safeJSON } = require('../utils/helpers');
const { joinSession, leaveSession } = require('../systems/sessionSystem');
const { createTicket, closeTicket } = require('../systems/ticketSystem');
const { startVerification, confirmVerification, pendingVerifications } = require('../systems/verificationSystem');
const { handleRoleToggle, PING_ROLES } = require('../systems/roleSelector');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ─── Slash Commands ────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[Command Error] /${interaction.commandName}:`, err);
        const msg = { content: '❌ An error occurred. Please try again.', ephemeral: true };
        if (interaction.deferred || interaction.replied) await interaction.editReply(msg).catch(() => {});
        else await interaction.reply(msg).catch(() => {});
      }
      return;
    }

    if (!interaction.isButton()) return;
    const id = interaction.customId;

    // Session buttons
    if (id.startsWith('session_join_')) return joinSession(interaction, parseInt(id.split('_')[2]));
    if (id.startsWith('session_leave_')) return leaveSession(interaction, parseInt(id.split('_')[2]));
    if (id.startsWith('session_info_')) {
      const sessionId = parseInt(id.split('_')[2]);
      const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) return interaction.reply({ content: '❌ Session not found.', ephemeral: true });
      const { sessionEmbed } = require('../utils/embeds');
      return interaction.reply({ embeds: [sessionEmbed(session, null)], ephemeral: true });
    }

    // Ticket buttons
    if (id.startsWith('ticket_create_')) return createTicket(interaction, id.replace('ticket_create_', ''));
    if (id.startsWith('ticket_close_')) return closeTicket(interaction, parseInt(id.split('_')[2]));
    if (id.startsWith('ticket_transcript_')) {
      const ticketId = parseInt(id.split('_')[2]);
      const ticket = get('SELECT * FROM tickets WHERE id = ?', [ticketId]);
      return interaction.reply({ content: ticket?.transcript ? `📋 Transcript saved for ticket #${ticketId}.` : '❌ No transcript yet.', ephemeral: true });
    }

    // Verification
    if (id === 'verify_start') return startVerification(interaction);
    if (id === 'verify_confirm') return confirmVerification(interaction);
    if (id === 'verify_cancel') { pendingVerifications.delete(interaction.user.id); return interaction.reply({ content: '❌ Verification cancelled.', ephemeral: true }); }

    // Game votes
    if (id.startsWith('game_vote_')) {
      const parts = id.split('_');
      const voteType = parts[2];
      const gameId = parseInt(parts[3]);
      const game = get('SELECT * FROM games WHERE id = ?', [gameId]);
      if (!game) return interaction.reply({ content: '❌ Game not found.', ephemeral: true });
      const voters = safeJSON(game.voters, []);
      if (voters.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ Already voted!', ephemeral: true });
      voters.push(interaction.user.id);
      if (voteType === 'up') run('UPDATE games SET votes_up = votes_up + 1, voters = ? WHERE id = ?', [JSON.stringify(voters), gameId]);
      else run('UPDATE games SET votes_down = votes_down + 1, voters = ? WHERE id = ?', [JSON.stringify(voters), gameId]);
      return interaction.reply({ content: '✅ Vote recorded!', ephemeral: true });
    }

    // Event join
    if (id.startsWith('event_join_')) {
      const eventId = parseInt(id.split('_')[2]);
      const event = get('SELECT * FROM events WHERE id = ?', [eventId]);
      if (!event) return interaction.reply({ content: '❌ Event not found.', ephemeral: true });
      const participants = safeJSON(event.participants, []);
      if (participants.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ Already joined!', ephemeral: true });
      participants.push(interaction.user.id);
      run('UPDATE events SET participants = ? WHERE id = ?', [JSON.stringify(participants), eventId]);
      return interaction.reply({ content: `✅ Joined **${event.name}**!`, ephemeral: true });
    }

    // Suggestions
    if (id.startsWith('suggest_')) {
      const parts = id.split('_');
      const vote = parts[1];
      const suggId = parseInt(parts[2]);
      const suggestion = get('SELECT * FROM suggestions WHERE id = ?', [suggId]);
      if (!suggestion) return interaction.reply({ content: '❌ Not found.', ephemeral: true });
      const voters = safeJSON(suggestion.voters, []);
      if (voters.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ Already voted!', ephemeral: true });
      voters.push(interaction.user.id);
      if (vote === 'up') run('UPDATE suggestions SET votes_up = votes_up + 1, voters = ? WHERE id = ?', [JSON.stringify(voters), suggId]);
      else run('UPDATE suggestions SET votes_down = votes_down + 1, voters = ? WHERE id = ?', [JSON.stringify(voters), suggId]);
      const updated = get('SELECT * FROM suggestions WHERE id = ?', [suggId]);
      const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).spliceFields(1, 1, { name: '📊 Votes', value: `👍 ${updated.votes_up} | 👎 ${updated.votes_down}` });
      return interaction.update({ embeds: [newEmbed] });
    }

    // Giveaway entry
    if (id.startsWith('giveaway_enter_')) {
      const gid = parseInt(id.split('_')[2]);
      const g = get('SELECT * FROM giveaways WHERE id = ?', [gid]);
      if (!g || g.ended) return interaction.reply({ content: '❌ Giveaway has ended.', ephemeral: true });
      const entries = safeJSON(g.entries, []);
      if (entries.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ Already entered!', ephemeral: true });
      entries.push(interaction.user.id);
      run('UPDATE giveaways SET entries = ? WHERE id = ?', [JSON.stringify(entries), gid]);
      return interaction.reply({ content: `✅ Entered! Good luck! (${entries.length} entries)`, ephemeral: true });
    }

    // Ping role toggles
    if (PING_ROLES.some(r => r.id === id)) return handleRoleToggle(interaction);

    // Queue approve/deny buttons
    if (id.startsWith('queue_approve_') || id.startsWith('queue_deny_')) {
      const queueCmd = interaction.client.commands.get('queue');
      if (queueCmd) {
        const subId = parseInt(id.split('_')[2]);
        // Fake the subcommand options for button-triggered approve/deny
        if (id.startsWith('queue_approve_')) {
          if (!interaction.member.permissions.has(8n)) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
          // Ask for start time via modal-style follow-up
          return interaction.reply({
            content: `To approve submission #${subId}, use:\n\`/queue approve id:${subId} starttime:YYYY-MM-DD HH:mm\``,
            ephemeral: true,
          });
        } else {
          if (!interaction.member.permissions.has(8n)) return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
          const { run, get } = require('../database/db');
          const submission = get('SELECT * FROM queue_submissions WHERE id = ?', [subId]);
          if (!submission) return interaction.reply({ content: '❌ Not found.', ephemeral: true });
          run('UPDATE queue_submissions SET status = ? WHERE id = ?', ['denied', subId]);
          const submitter = await interaction.client.users.fetch(submission.user_id).catch(() => null);
          if (submitter) submitter.send(`❌ Your submission **${submission.game_name}** was denied.`).catch(() => {});
          return interaction.reply({ content: `✅ Submission #${subId} denied.`, ephemeral: true });
        }
      }
    }

    // Poll vote
    if (id.startsWith('poll_vote_')) {
      const parts = id.split('_');
      const pollId = parseInt(parts[2]);
      const optionIdx = parseInt(parts[3]);
      const poll = get('SELECT * FROM polls WHERE id = ?', [pollId]);
      if (!poll || poll.ended) return interaction.reply({ content: '❌ Poll has ended.', ephemeral: true });
      const votes = JSON.parse(poll.votes || '{}');
      if (votes[`v_${interaction.user.id}`] !== undefined) return interaction.reply({ content: '⚠️ Already voted!', ephemeral: true });
      votes[`v_${interaction.user.id}`] = optionIdx;
      votes[optionIdx] = (votes[optionIdx] || 0) + 1;
      run('UPDATE polls SET votes = ? WHERE id = ?', [JSON.stringify(votes), pollId]);
      const options = JSON.parse(poll.options || '[]');
      const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(options.map((o, i) => `**${i + 1}.** ${o} — ${votes[i] || 0} votes`).join('\n'));
      return interaction.update({ embeds: [newEmbed] });
    }
  },
};
