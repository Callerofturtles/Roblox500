const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { run, get } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn').setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    run('INSERT INTO warnings (user_id, guild_id, mod_id, reason) VALUES (?,?,?,?)', [target.id, interaction.guild.id, interaction.user.id, reason]);
    const count = get('SELECT COUNT(*) as cnt FROM warnings WHERE user_id = ? AND guild_id = ?', [target.id, interaction.guild.id])?.cnt || 0;
    try { await target.send(`⚠️ You were warned in **${interaction.guild.name}**: ${reason}`); } catch {}
    const embed = new EmbedBuilder().setColor(config.colors.warning).setTitle('⚠️ Member Warned')
      .addFields({ name: 'User', value: target.tag, inline: true }, { name: 'Warnings', value: `${count}`, inline: true }, { name: 'Reason', value: reason })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
