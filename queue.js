const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { run, get, all, getUser, lastInsertId } = require('../../database/db');
const axios = require('axios');
const config = require('../../config');

// How many queue points a user has = XP + (tokens * 0.5) + (sessions * 500) + (reputation * 100)
function calcQueuePoints(user) {
  return Math.floor(
    (user.xp || 0) +
    (user.tokens || 0) * 0.5 +
    (user.voice_minutes || 0) * 2 +
    get('SELECT sessions_completed as s FROM profiles WHERE user_id = ?', [user.id])?.s || 0 * 500 +
    (user.reputation || 0) * 100
  );
}

function getQueueRank(points) {
  if (points >= 10000) return { rank: '👑 Priority', minToSubmit: true, color: config.colors.gold };
  if (points >= 5000)  return { rank: '🔴 High',     minToSubmit: true, color: config.colors.danger };
  if (points >= 2000)  return { rank: '🟠 Medium',   minToSubmit: true, color: 0xff8800 };
  if (points >= 500)   return { rank: '🟡 Low',      minToSubmit: true, color: config.colors.warning };
  return { rank: '⚪ New',       minToSubmit: false, color: 0x808080 };
}

async function fetchRobloxGame(placeId) {
  try {
    // Get place details
    const placeRes = await axios.get(
      `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`
    ).catch(() => null);
    const place = placeRes?.data?.[0];
    if (!place) return null;

    // Get universe details (for full game info)
    const universeId = place.universeId;
    const gameRes = await axios.get(
      `https://games.roblox.com/v1/games?universeIds=${universeId}`
    ).catch(() => null);
    const game = gameRes?.data?.data?.[0];

    return {
      name: game?.name || place.name || `Game #${placeId}`,
      description: game?.description || '',
      playing: game?.playing || 0,
      visits: game?.visits || 0,
      creator: game?.creator?.name || 'Unknown',
      link: `https://www.roblox.com/games/${placeId}`,
      thumbnail: `https://www.roblox.com/games/${placeId}`,
    };
  } catch { return null; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Testing queue — submit your game and track your priority')
    .addSubcommand(s => s.setName('view').setDescription('See your queue rank and position'))
    .addSubcommand(s => s.setName('submit').setDescription('Submit your game for a testing session')
      .addStringOption(o => o.setName('gameid').setDescription('Your Roblox Place ID (the number in your game URL)').setRequired(true))
      .addIntegerOption(o => o.setName('players').setDescription('How many players do you need? (default 5)').setMinValue(2).setMaxValue(20))
      .addStringOption(o => o.setName('notes').setDescription('Any notes for the testers')))
    .addSubcommand(s => s.setName('position').setDescription('See the full queue leaderboard'))
    .addSubcommand(s => s.setName('list').setDescription('View pending game submissions'))
    .addSubcommand(s => s.setName('approve').setDescription('[Admin] Approve a submission')
      .addIntegerOption(o => o.setName('id').setDescription('Submission ID').setRequired(true))
      .addStringOption(o => o.setName('starttime').setDescription('Session start time (YYYY-MM-DD HH:mm)').setRequired(true)))
    .addSubcommand(s => s.setName('deny').setDescription('[Admin] Deny a submission')
      .addIntegerOption(o => o.setName('id').setDescription('Submission ID').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason'))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── VIEW ──────────────────────────────────────────────────────────
    if (sub === 'view') {
      const user = getUser(interaction.user.id);
      const points = calcQueuePoints(user);
      const { rank, minToSubmit, color } = getQueueRank(points);

      // Position: how many users have MORE points
      const position = all(
        'SELECT id FROM users WHERE (xp + tokens * 0.5 + voice_minutes * 2 + reputation * 100) > ?',
        [points]
      ).length + 1;

      const pending = get('SELECT * FROM queue_submissions WHERE user_id = ? AND status = ?', [interaction.user.id, 'pending']);

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`📋 ${interaction.user.username}'s Queue Status`)
        .addFields(
          { name: '🏅 Queue Rank', value: rank, inline: true },
          { name: '⭐ Queue Points', value: `**${points.toLocaleString()}**`, inline: true },
          { name: '📊 Position', value: `**#${position}**`, inline: true },
          { name: '✅ Can Submit', value: minToSubmit ? 'Yes' : 'Not yet (need 500+ points)', inline: true },
          { name: '📥 Active Submission', value: pending ? `#${pending.id} — ${pending.game_name} (${pending.status})` : 'None', inline: true },
        )
        .addFields({ name: '📈 How to earn points', value: '💬 Chat (+XP) • 🎙️ Voice (+XP) • 🎮 Sessions (+500/session) • ⭐ Rep (+100/rep)', inline: false })
        .setFooter({ text: 'Ranks: ⚪ New → 🟡 Low → 🟠 Medium → 🔴 High → 👑 Priority' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── POSITION LEADERBOARD ─────────────────────────────────────────
    else if (sub === 'position') {
      const topUsers = all(`
        SELECT id, xp, tokens, voice_minutes, reputation,
          (xp + tokens * 0.5 + voice_minutes * 2 + reputation * 100) AS pts
        FROM users
        ORDER BY pts DESC
        LIMIT 20
      `);

      if (!topUsers.length) {
        return interaction.reply({ content: '📋 Nobody is in the queue yet!', ephemeral: true });
      }

      const myUser = getUser(interaction.user.id);
      const myPoints = calcQueuePoints(myUser);
      const myPosition = all(
        'SELECT id FROM users WHERE (xp + tokens * 0.5 + voice_minutes * 2 + reputation * 100) > ?',
        [myPoints]
      ).length + 1;

      const lines = await Promise.all(
        topUsers.map(async (u, i) => {
          const { rank } = getQueueRank(Math.floor(u.pts));
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
          let name = `<@${u.id}>`;
          try {
            const member = await interaction.guild.members.fetch(u.id).catch(() => null);
            if (member) name = member.displayName;
          } catch {}
          return `${medal} ${name} — ${rank} **${Math.floor(u.pts).toLocaleString()} pts**`;
        })
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle('📋 Queue Position Leaderboard')
        .setDescription(lines.join('\n'))
        .addFields({ name: '📊 Your Position', value: `You are **#${myPosition}** with **${Math.floor(myPoints).toLocaleString()} pts**`, inline: false })
        .setFooter({ text: 'Earn points by chatting, voice, sessions & reputation' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    // ── SUBMIT ────────────────────────────────────────────────────────
    else if (sub === 'submit') {
      const user = getUser(interaction.user.id);
      const points = calcQueuePoints(user);
      const { minToSubmit, rank } = getQueueRank(points);

      if (!minToSubmit) {
        return interaction.reply({
          content: [
            `❌ **Queue rank too low to submit.** You're currently **${rank}** with **${points} points**.`,
            '',
            'You need **500+ points** to submit a game. Earn them by:',
            '• Chatting in the server',
            '• Being active in voice channels',
            '• Attending testing sessions',
            '• Receiving reputation',
          ].join('\n'),
          ephemeral: true,
        });
      }

      const existing = get('SELECT * FROM queue_submissions WHERE user_id = ? AND status = ?', [interaction.user.id, 'pending']);
      if (existing) {
        return interaction.reply({ content: `❌ You already have a pending submission (#${existing.id}). Wait for it to be reviewed first.`, ephemeral: true });
      }

      const rawId = interaction.options.getString('gameid').trim();
      if (!/^\d+$/.test(rawId)) {
        return interaction.reply({ content: '❌ Game ID must be numbers only. Find it in your game\'s URL: `roblox.com/games/**12345678**/game-name`', ephemeral: true });
      }

      await interaction.reply({ content: '⏳ Fetching your game info from Roblox...', ephemeral: true });

      const gameInfo = await fetchRobloxGame(rawId);
      if (!gameInfo) {
        return interaction.editReply('❌ Couldn\'t find that game. Double-check the Place ID (the number in your game URL).');
      }

      const players = interaction.options.getInteger('players') || 5;
      const notes = interaction.options.getString('notes') || '';

      run(`INSERT INTO queue_submissions (user_id, place_id, game_name, game_link, players_needed, notes, status, queue_points)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [interaction.user.id, rawId, gameInfo.name, gameInfo.link, players, notes, points]);
      const subId = lastInsertId();

      // Notify admins in a staff channel if it exists
      const staffChannel = interaction.guild.channels.cache.find(c =>
        c.name.includes('staff') || c.name.includes('admin') || c.name.includes('mod')
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle(`📥 New Queue Submission #${subId}`)
        .setDescription(`**${gameInfo.name}**\n${gameInfo.description?.slice(0, 150) || 'No description'}`)
        .addFields(
          { name: '🔗 Game Link', value: gameInfo.link, inline: true },
          { name: '👥 Players Needed', value: `${players}`, inline: true },
          { name: '👤 Submitted by', value: `<@${interaction.user.id}>`, inline: true },
          { name: '🏅 Queue Rank', value: `${getQueueRank(points).rank} (${points} pts)`, inline: true },
          { name: '📝 Notes', value: notes || 'None', inline: false },
        )
        .setFooter({ text: `Use /queue approve ${subId} or /queue deny ${subId}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`queue_approve_${subId}`).setLabel('✅ Approve').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`queue_deny_${subId}`).setLabel('❌ Deny').setStyle(ButtonStyle.Danger),
      );

      if (staffChannel) staffChannel.send({ embeds: [embed], components: [row] });

      await interaction.editReply(`✅ Submitted **${gameInfo.name}** for review! Submission ID: **#${subId}**\nAdmins will approve or deny it soon.`);
    }

    // ── LIST ──────────────────────────────────────────────────────────
    else if (sub === 'list') {
      const submissions = all('SELECT * FROM queue_submissions WHERE status = ? ORDER BY queue_points DESC LIMIT 10', ['pending']);

      if (!submissions.length) return interaction.reply({ content: '📭 No pending submissions.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle('📋 Testing Queue — Pending Submissions')
        .setDescription('Sorted by queue priority (highest rank first)')
        .setTimestamp();

      for (const s of submissions) {
        const { rank } = getQueueRank(s.queue_points);
        embed.addFields({
          name: `#${s.id} — ${s.game_name}`,
          value: `By <@${s.user_id}> • ${rank} • [Play](${s.game_link}) • 👥 ${s.players_needed} players`,
        });
      }

      await interaction.reply({ embeds: [embed] });
    }

    // ── APPROVE ───────────────────────────────────────────────────────
    else if (sub === 'approve') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
      }

      const subId = interaction.options.getInteger('id');
      const startRaw = interaction.options.getString('starttime');
      const submission = get('SELECT * FROM queue_submissions WHERE id = ?', [subId]);
      if (!submission) return interaction.reply({ content: '❌ Submission not found.', ephemeral: true });
      if (submission.status !== 'pending') return interaction.reply({ content: '❌ Already reviewed.', ephemeral: true });

      const { parseDateTime } = require('../../utils/helpers');
      const startTime = parseDateTime(startRaw);
      if (!startTime) return interaction.reply({ content: '❌ Invalid time format. Use `YYYY-MM-DD HH:mm`', ephemeral: true });

      await interaction.reply({ content: '⏳ Approving and creating session...', ephemeral: true });

      // Create the session
      run(`INSERT INTO sessions (host_id, game_name, roblox_link, player_requirement, start_time, duration, status)
           VALUES (?, ?, ?, ?, ?, 60, 'open')`,
        [submission.user_id, submission.game_name, submission.game_link, submission.players_needed, startTime]);
      const sessionId = lastInsertId();

      run('UPDATE queue_submissions SET status = ?, session_id = ? WHERE id = ?', ['approved', sessionId, subId]);

      // Notify submitter
      const submitter = await interaction.client.users.fetch(submission.user_id).catch(() => null);
      if (submitter) {
        submitter.send([
          `✅ **Your game has been approved for testing!**`,
          ``,
          `**${submission.game_name}** has been scheduled.`,
          `Session starts: <t:${startTime}:F>`,
          `Use \`/session info ${sessionId}\` to see details.`,
        ].join('\n')).catch(() => {});
      }

      // Ping testers role
      const testersRole = interaction.guild.roles.cache.find(r => r.name === '🧪 Testers');
      const sessionChannel = interaction.guild.channels.cache.find(c =>
        c.name.includes('testing') || c.name.includes('session') || c.name.includes('general')
      );

      if (sessionChannel) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle(`✅ New Session Approved: ${submission.game_name}`)
          .addFields(
            { name: '🔗 Game', value: `[Play Now](${submission.game_link})`, inline: true },
            { name: '📅 Start Time', value: `<t:${startTime}:F>`, inline: true },
            { name: '👥 Players Needed', value: `${submission.players_needed}`, inline: true },
          )
          .setFooter({ text: `Use /session join ${sessionId} to participate` })
          .setTimestamp();

        sessionChannel.send({
          content: testersRole ? `<@&${testersRole.id}> New testing session!` : undefined,
          embeds: [embed],
        });
      }

      await interaction.editReply(`✅ Approved! Session #${sessionId} created and testers notified.`);
    }

    // ── DENY ──────────────────────────────────────────────────────────
    else if (sub === 'deny') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
      }

      const subId = interaction.options.getInteger('id');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const submission = get('SELECT * FROM queue_submissions WHERE id = ?', [subId]);
      if (!submission) return interaction.reply({ content: '❌ Submission not found.', ephemeral: true });

      run('UPDATE queue_submissions SET status = ? WHERE id = ?', ['denied', subId]);

      const submitter = await interaction.client.users.fetch(submission.user_id).catch(() => null);
      if (submitter) {
        submitter.send(`❌ Your submission **${submission.game_name}** was denied.\nReason: ${reason}`).catch(() => {});
      }

      await interaction.reply({ content: `✅ Submission #${subId} denied. Submitter notified.`, ephemeral: true });
    }
  },
};
