const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config');

const PING_ROLES = [
  { id: 'role_testers',    label: '🧪 Testers',       description: 'Get pinged for testing sessions',     color: 0x00ff88 },
  { id: 'role_events',     label: '📅 Events',         description: 'Get pinged for server events',         color: 0x00d4ff },
  { id: 'role_active',     label: '💬 Active',          description: 'Get pinged for community activities',  color: 0x9b59b6 },
  { id: 'role_horror',     label: '🩸 Horror Gamers',  description: 'Get pinged for horror game sessions',  color: 0x8b0000 },
  { id: 'role_giveaways',  label: '🎉 Giveaways',      description: 'Get pinged for giveaways',             color: 0xffd700 },
];

async function sendRolePanel(channel) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle('🎭 Choose Your Ping Roles')
    .setDescription('Click the buttons below to **add or remove** ping roles.\nYou\'ll only get pinged for things you care about!')
    .addFields(PING_ROLES.map(r => ({
      name: r.label,
      value: r.description,
      inline: true,
    })))
    .setFooter({ text: 'Click again to remove a role • Roblox Launch Network' })
    .setTimestamp();

  // Split into rows of 5
  const rows = [];
  for (let i = 0; i < PING_ROLES.length; i += 5) {
    const chunk = PING_ROLES.slice(i, i + 5);
    rows.push(
      new ActionRowBuilder().addComponents(
        chunk.map(r =>
          new ButtonBuilder()
            .setCustomId(r.id)
            .setLabel(r.label)
            .setStyle(ButtonStyle.Secondary)
        )
      )
    );
  }

  await channel.send({ embeds: [embed], components: rows });
}

async function handleRoleToggle(interaction) {
  const roleData = PING_ROLES.find(r => r.id === interaction.customId);
  if (!roleData) return;

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  let role = guild.roles.cache.find(r => r.name === roleData.label);

  if (!role) {
    role = await guild.roles.create({
      name: roleData.label,
      color: roleData.color,
      mentionable: true,
      reason: 'Auto-created ping role',
    }).catch(() => null);
  }

  if (!role) return interaction.editReply({ content: '❌ Failed to find or create that role. Ask an admin.' });

  const member = interaction.member;
  const hasRole = member.roles.cache.has(role.id);

  if (hasRole) {
    await member.roles.remove(role);
    await interaction.editReply({ content: `✅ Removed **${roleData.label}** — you won't be pinged anymore.` });
  } else {
    await member.roles.add(role);
    await interaction.editReply({ content: `✅ Added **${roleData.label}** — you'll now get pinged!` });
  }
}

module.exports = { sendRolePanel, handleRoleToggle, PING_ROLES };
