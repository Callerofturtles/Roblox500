const { handleLeave } = require('../systems/inviteSystem');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    await handleLeave(member).catch(() => {});

    const channel = member.guild.channels.cache.find(c => c.name.includes('general'));
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setTitle('👋 Member Left')
      .setDescription(`**${member.user.tag}** has left the server.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: `${member.guild.memberCount} members remaining` });

    channel.send({ embeds: [embed] }).catch(() => {});
  },
};
