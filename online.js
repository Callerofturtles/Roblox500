const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { all } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('online')
    .setDescription('See how many verified Roblox members are online and available to test')
    .addStringOption(o =>
      o.setName('filter')
        .setDescription('Who to show (default: verified Roblox members only)')
        .addChoices(
          { name: '✅ Verified Roblox only (default)', value: 'verified' },
          { name: '🧪 Testers role only', value: 'testers' },
          { name: '👥 Everyone', value: 'everyone' },
        )),

  async execute(interaction) {
    await interaction.deferReply();

    const filter = interaction.options.getString('filter') ?? 'verified';
    const guild = interaction.guild;

    // Fetch all members with presence data
    await guild.members.fetch({ withPresences: true });

    let members = guild.members.cache.filter(m => !m.user.bot);

    if (filter === 'verified') {
      // Pull all Bloxlink-verified user IDs from our local DB
      const verifiedRows = all('SELECT id, roblox_username FROM users WHERE roblox_verified = 1');
      const verifiedMap = new Map(verifiedRows.map(r => [r.id, r.roblox_username]));

      members = members.filter(m => verifiedMap.has(m.id));

      // Attach roblox username to each member for display
      members = new Map(
        [...members.entries()].map(([id, m]) => {
          m._robloxName = verifiedMap.get(id);
          return [id, m];
        })
      );

    } else if (filter === 'testers') {
      const testersRole = guild.roles.cache.find(r => r.name === 'Testers');
      if (testersRole) members = members.filter(m => m.roles.cache.has(testersRole.id));
    }

    const online  = [...members.values()].filter(m => m.presence?.status === 'online');
    const idle    = [...members.values()].filter(m => m.presence?.status === 'idle');
    const dnd     = [...members.values()].filter(m => m.presence?.status === 'dnd');
    const offline = [...members.values()].filter(m =>
      !m.presence || m.presence.status === 'offline' || m.presence.status === 'invisible'
    );

    const available = online.length + idle.length + dnd.length;

    // Build display list — show Roblox username if available
    const displayName = m =>
      filter === 'verified' && m._robloxName
        ? `${m.displayName} *(${m._robloxName})*`
        : m.displayName;

    const onlineList = [...online, ...idle]
      .slice(0, 20)
      .map(m => `🟢 ${displayName(m)}`)
      .join('\n');

    const dndList = dnd
      .slice(0, 10)
      .map(m => `🔴 ${displayName(m)}`)
      .join('\n');

    const shownList = [onlineList, dndList].filter(Boolean).join('\n') || 'Nobody available right now.';

    const filterLabel =
      filter === 'verified' ? '✅ Bloxlink-verified members'
      : filter === 'testers' ? '🧪 Testers role'
      : '👥 All members';

    const embed = new EmbedBuilder()
      .setColor(available > 0 ? config.colors.success : config.colors.warning)
      .setTitle('🟢 Available Testers')
      .setDescription(
        `**${available}** ${filter === 'verified' ? 'verified Roblox' : ''} member${available !== 1 ? 's' : ''} available to test right now!\n` +
        `*(Filter: ${filterLabel})*`
      )
      .addFields(
        { name: '🟢 Online',          value: `**${online.length}**`,   inline: true },
        { name: '🟡 Idle',            value: `**${idle.length}**`,     inline: true },
        { name: '🔴 Do Not Disturb',  value: `**${dnd.length}**`,      inline: true },
        { name: '⚫ Offline',          value: `**${offline.length}**`,  inline: true },
        { name: `${filter === 'verified' ? '✅ Verified' : '👥'} Total`, value: `**${members.size ?? members.length}**`, inline: true },
        { name: '\u200b',             value: '\u200b',                  inline: true },
        {
          name: `Available right now (${Math.min(online.length + idle.length + dnd.length, 30)} shown)`,
          value: shownList,
          inline: false,
        }
      )
      .setFooter({ text: filter === 'verified' ? 'Showing Discord tag + Roblox username • Members must /verify to appear here' : 'Use /online filter:Verified to show Roblox-verified members' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
