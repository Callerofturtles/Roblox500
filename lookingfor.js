const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { run, all } = require('../../database/db');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lookingfor').setDescription('Find collaborators or post your skills')
    .addSubcommand(s => s.setName('post').setDescription('Post your availability')
      .addStringOption(o => o.setName('role').setDescription('Your role').setRequired(true).addChoices(
        { name: '⚙️ Scripter', value: 'scripter' }, { name: '🏗️ Builder', value: 'builder' },
        { name: '🎨 UI Artist', value: 'ui-artist' }, { name: '🔊 Sound Designer', value: 'sound-designer' },
        { name: '🧪 Tester', value: 'tester' }, { name: '🎯 Game Designer', value: 'game-designer' }
      ))
      .addStringOption(o => o.setName('description').setDescription('Describe yourself').setRequired(true))
      .addStringOption(o => o.setName('skills').setDescription('Comma-separated skills')))
    .addSubcommand(s => s.setName('find').setDescription('Find someone')
      .addStringOption(o => o.setName('role').setDescription('Role to find').setRequired(true).addChoices(
        { name: '⚙️ Scripter', value: 'scripter' }, { name: '🏗️ Builder', value: 'builder' },
        { name: '🎨 UI Artist', value: 'ui-artist' }, { name: '🔊 Sound Designer', value: 'sound-designer' },
        { name: '🧪 Tester', value: 'tester' }, { name: '🎯 Game Designer', value: 'game-designer' }
      ))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'post') {
      const role = interaction.options.getString('role');
      const desc = interaction.options.getString('description');
      const skills = interaction.options.getString('skills') || '';
      run('INSERT INTO matchmaking (user_id, role, description, skills) VALUES (?,?,?,?)', [interaction.user.id, role, desc, JSON.stringify(skills.split(',').map(s => s.trim()))]);
      await interaction.reply({ content: `✅ Posted! Others can find you with \`/lookingfor find ${role}\`.`, ephemeral: true });
    } else {
      const role = interaction.options.getString('role');
      const listings = all('SELECT * FROM matchmaking WHERE role = ? AND active = 1 ORDER BY created_at DESC LIMIT 8', [role]);
      if (!listings.length) return interaction.reply({ content: `📭 No **${role}s** found right now.`, ephemeral: true });
      const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle(`🔍 Looking for ${role}s`).setTimestamp();
      for (const l of listings) {
        const skills = JSON.parse(l.skills || '[]').filter(Boolean);
        embed.addFields({ name: `<@${l.user_id}>`, value: `${l.description}${skills.length ? `\n*Skills: ${skills.join(', ')}*` : ''}` });
      }
      await interaction.reply({ embeds: [embed] });
    }
  },
};
