const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createSession, joinSession, leaveSession, endSession } = require('../../systems/sessionSystem');
const { get, all } = require('../../database/db');
const { sessionEmbed } = require('../../utils/embeds');
const { parseDateTime } = require('../../utils/helpers');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('session')
    .setDescription('Testing session management')
    .addSubcommand(s => s.setName('create').setDescription('Create a testing session')
      .addStringOption(o => o.setName('game').setDescription('Game name').setRequired(true))
      .addStringOption(o => o.setName('link').setDescription('Roblox game link').setRequired(true))
      .addStringOption(o => o.setName('starttime').setDescription('Start time (YYYY-MM-DD HH:mm or HH:mm)').setRequired(true))
      .addIntegerOption(o => o.setName('players').setDescription('Player requirement (default 5)'))
      .addIntegerOption(o => o.setName('duration').setDescription('Duration in minutes (default 60)'))
      .addStringOption(o => o.setName('reward').setDescription('Reward for attending'))
      .addIntegerOption(o => o.setName('age').setDescription('Age requirement (default 16)'))
      .addBooleanOption(o => o.setName('vc').setDescription('Voice chat required?')))
    .addSubcommand(s => s.setName('join').setDescription('Join a session').addIntegerOption(o => o.setName('id').setDescription('Session ID').setRequired(true)))
    .addSubcommand(s => s.setName('leave').setDescription('Leave a session').addIntegerOption(o => o.setName('id').setDescription('Session ID').setRequired(true)))
    .addSubcommand(s => s.setName('end').setDescription('End your session').addIntegerOption(o => o.setName('id').setDescription('Session ID').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List open sessions'))
    .addSubcommand(s => s.setName('info').setDescription('View session details').addIntegerOption(o => o.setName('id').setDescription('Session ID').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const gameName = interaction.options.getString('game');
      const robloxLink = interaction.options.getString('link');
      const startRaw = interaction.options.getString('starttime');
      const startTime = parseDateTime(startRaw);
      if (!startTime) return interaction.reply({ content: '❌ Invalid start time. Use `YYYY-MM-DD HH:mm` or `HH:mm`.', ephemeral: true });
      if (startTime <= Math.floor(Date.now() / 1000)) return interaction.reply({ content: '❌ Start time must be in the future.', ephemeral: true });

      await createSession(interaction, {
        gameName, robloxLink,
        playerReq: interaction.options.getInteger('players') || 5,
        startTime,
        duration: interaction.options.getInteger('duration') || 60,
        reward: interaction.options.getString('reward') || '',
        ageReq: interaction.options.getInteger('age') || 16,
        vcRequired: interaction.options.getBoolean('vc') || false,
      });
    } else if (sub === 'join') {
      await joinSession(interaction, interaction.options.getInteger('id'));
    } else if (sub === 'leave') {
      await leaveSession(interaction, interaction.options.getInteger('id'));
    } else if (sub === 'end') {
      const sessionId = interaction.options.getInteger('id');
      const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) return interaction.reply({ content: '❌ Session not found.', ephemeral: true });
      if (session.host_id !== interaction.user.id && !interaction.member.permissions.has(8n)) {
        return interaction.reply({ content: '❌ Only the host can end this session.', ephemeral: true });
      }
      await endSession(sessionId, interaction.client);
      await interaction.reply({ content: `✅ Session **${session.game_name}** ended. Rewards distributed!` });
    } else if (sub === 'list') {
      const sessions = all('SELECT * FROM sessions WHERE status = ? ORDER BY start_time ASC LIMIT 10', ['open']);
      if (!sessions.length) return interaction.reply({ content: '📭 No open sessions. Create one with `/session create`!', ephemeral: true });
      const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle('🎮 Open Testing Sessions').setTimestamp().setFooter({ text: 'Use /session join <id> to participate' });
      for (const s of sessions) {
        const participants = JSON.parse(s.participants || '[]');
        embed.addFields({ name: `#${s.id} — ${s.game_name}`, value: `Host: <@${s.host_id}> • Players: ${participants.length}/${s.player_requirement} • Starts: <t:${s.start_time}:R>` });
      }
      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'info') {
      const sessionId = interaction.options.getInteger('id');
      const session = get('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) return interaction.reply({ content: '❌ Session not found.', ephemeral: true });
      await interaction.reply({ embeds: [sessionEmbed(session, null)] });
    }
  },
};
