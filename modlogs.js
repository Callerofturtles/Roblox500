const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { all, get } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlogs').setDescription('View moderation logs for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const actions = all('SELECT * FROM moderation WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [target.id]);
    const warns = get('SELECT COUNT(*) as cnt FROM warnings WHERE user_id = ?', [target.id])?.cnt || 0;
    const embed = new EmbedBuilder().setColor(config.colors.danger).setTitle(`📋 Mod Logs — ${target.tag}`)
      .setDescription(`**Total Warnings:** ${warns}`).setTimestamp();
    if (!actions.length) embed.addFields({ name: 'Actions', value: 'No moderation history.' });
    else for (const a of actions) embed.addFields({ name: `${a.action.toUpperCase()} — <t:${a.created_at}:R>`, value: `Mod: <@${a.mod_id}>\nReason: ${a.reason}` });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
