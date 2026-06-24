const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { sendTicketPanel } = require('../../systems/ticketSystem');
const { sendVerificationPanel } = require('../../systems/verificationSystem');
const { sendRolePanel } = require('../../systems/roleSelector');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup').setDescription('Setup bot panels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('tickets').setDescription('Send the ticket panel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)))
    .addSubcommand(s => s.setName('verify').setDescription('Send the verification panel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)))
    .addSubcommand(s => s.setName('roles').setDescription('Send the ping role picker panel').addChannelOption(o => o.setName('channel').setDescription('Channel').setRequired(true)))
    .addSubcommand(s => s.setName('server').setDescription('Auto-create full server structure')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'tickets') {
      const ch = interaction.options.getChannel('channel');
      await interaction.reply({ content: `⏳ Sending ticket panel to ${ch}...`, ephemeral: true });
      await sendTicketPanel(ch);
      await interaction.editReply(`✅ Ticket panel sent to ${ch}!`);

    } else if (sub === 'verify') {
      const ch = interaction.options.getChannel('channel');
      await interaction.reply({ content: `⏳ Sending verification panel to ${ch}...`, ephemeral: true });
      await sendVerificationPanel(ch);
      await interaction.editReply(`✅ Verification panel sent to ${ch}!`);

    } else if (sub === 'roles') {
      const ch = interaction.options.getChannel('channel');
      await interaction.reply({ content: `⏳ Sending role picker to ${ch}...`, ephemeral: true });
      await sendRolePanel(ch);
      await interaction.editReply(`✅ Role picker panel sent to ${ch}!`);

    } else if (sub === 'server') {
      await interaction.reply({ content: '⏳ Creating server structure... this may take a moment.', ephemeral: true });

      const guild = interaction.guild;
      const categoryData = [
        { name: '🚀 START HERE', channels: ['📋│rules', '📢│announcements', '✅│verify', '📖│server-guide', '🎭│roles'] },
        { name: '💬 COMMUNITY', channels: ['💬│general', '🖼️│media', '😂│memes', '🌐│off-topic'] },
        { name: '🛠️ ROBLOX DEV', channels: ['⚙️│scripting', '🏗️│building', '🎨│ui-design', '🔊│sound-design', '💼│commissions', '📢│recruiting'] },
        { name: '🎮 GAME TESTING', channels: ['📋│testing-queue', '🔴│active-tests', '👀│looking-for-players', '📝│feedback', '🐛│bug-reports'] },
        { name: '🩸 HORROR GAMES', channels: ['💀│horror-chat', '👁️│horror-media', '😱│scary-game-ideas'] },
        { name: '🏆 EVENTS', channels: ['📣│event-announcements', '🏅│tournaments', '🎙️│live-sessions'] },
        { name: '🎫 SUPPORT', channels: ['🎟️│tickets', '🚨│report-player', '⚖️│appeals'] },
      ];

      let created = 0;
      for (const cat of categoryData) {
        try {
          const category = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
          for (const chName of cat.channels) {
            await guild.channels.create({ name: chName, type: ChannelType.GuildText, parent: category.id });
            created++;
          }
        } catch (e) { console.error('[Setup]', e.message); }
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ Server Structure Created!')
        .setDescription([
          `Created **${created}** channels across **${categoryData.length}** categories.`,
          '',
          '**Next steps:**',
          '• `/setup tickets #🎟️│tickets`',
          '• `/setup verify #✅│verify`',
          '• `/setup roles #🎭│roles`',
        ].join('\n'))
        .setTimestamp();

      await interaction.editReply({ content: null, embeds: [embed] });
    }
  },
};
