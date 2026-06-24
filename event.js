const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { run, get, all, lastInsertId } = require('../../database/db');
const { parseDateTime } = require('../../utils/helpers');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event').setDescription('Event management')
    .addSubcommand(s => s.setName('create').setDescription('Create an event')
      .addStringOption(o => o.setName('name').setDescription('Event name').setRequired(true))
      .addStringOption(o => o.setName('description').setDescription('Description').setRequired(true))
      .addStringOption(o => o.setName('starttime').setDescription('Start time (YYYY-MM-DD HH:mm)').setRequired(true))
      .addStringOption(o => o.setName('type').setDescription('Event type').addChoices(
        { name: '🩸 Horror Night', value: 'horror' }, { name: '🎮 Mass Test', value: 'test' },
        { name: '🏆 Tournament', value: 'tournament' }, { name: '🎨 Game Jam', value: 'gamejam' },
        { name: '⚡ General', value: 'general' }
      ))
      .addStringOption(o => o.setName('reward').setDescription('Reward for participants')))
    .addSubcommand(s => s.setName('join').setDescription('Join an event').addIntegerOption(o => o.setName('id').setDescription('Event ID').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('List upcoming events')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEvents)) return interaction.reply({ content: '❌ Need Manage Events permission.', ephemeral: true });
      const name = interaction.options.getString('name');
      const desc = interaction.options.getString('description');
      const startTime = parseDateTime(interaction.options.getString('starttime'));
      if (!startTime) return interaction.reply({ content: '❌ Invalid date. Use `YYYY-MM-DD HH:mm`', ephemeral: true });
      const type = interaction.options.getString('type') || 'general';
      const reward = interaction.options.getString('reward') || 'None';
      const emojis = { horror: '🩸', test: '🎮', tournament: '🏆', gamejam: '🎨', general: '⚡' };

      const embed = new EmbedBuilder()
        .setColor(type === 'horror' ? config.colors.horror : config.colors.accent)
        .setTitle(`${emojis[type] || '⚡'} ${name}`).setDescription(desc)
        .addFields({ name: '📅 Start', value: `<t:${startTime}:F>`, inline: true }, { name: '🎁 Reward', value: reward, inline: true }, { name: '👥 Participants', value: '0', inline: true })
        .setTimestamp().setFooter({ text: 'Click Join to participate!' });

      const tempRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('event_join_0').setLabel('✅ Join Event').setStyle(ButtonStyle.Success));
      const msg = await interaction.reply({ embeds: [embed], components: [tempRow], fetchReply: true });
      run('INSERT INTO events (host_id, name, description, type, start_time, reward, message_id) VALUES (?,?,?,?,?,?,?)', [interaction.user.id, name, desc, type, startTime, reward, msg.id]);
      const eventId = lastInsertId();
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`event_join_${eventId}`).setLabel('✅ Join Event').setStyle(ButtonStyle.Success));
      await msg.edit({ components: [row] });
    } else if (sub === 'join') {
      const eventId = interaction.options.getInteger('id');
      const event = get('SELECT * FROM events WHERE id = ?', [eventId]);
      if (!event) return interaction.reply({ content: '❌ Event not found.', ephemeral: true });
      const participants = JSON.parse(event.participants || '[]');
      if (participants.includes(interaction.user.id)) return interaction.reply({ content: '⚠️ Already joined!', ephemeral: true });
      participants.push(interaction.user.id);
      run('UPDATE events SET participants = ? WHERE id = ?', [JSON.stringify(participants), eventId]);
      await interaction.reply({ content: `✅ Joined **${event.name}**! Starts <t:${event.start_time}:R>.`, ephemeral: true });
    } else if (sub === 'list') {
      const events = all('SELECT * FROM events WHERE status = ? AND start_time > ? ORDER BY start_time ASC LIMIT 5', ['upcoming', Math.floor(Date.now() / 1000)]);
      if (!events.length) return interaction.reply({ content: '📭 No upcoming events. Check back soon!', ephemeral: true });
      const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle('📅 Upcoming Events').setTimestamp();
      for (const e of events) {
        const cnt = JSON.parse(e.participants || '[]').length;
        embed.addFields({ name: `#${e.id} — ${e.name}`, value: `Starts: <t:${e.start_time}:R> • 👥 ${cnt} joined\nHost: <@${e.host_id}>` });
      }
      await interaction.reply({ embeds: [embed] });
    }
  },
};
