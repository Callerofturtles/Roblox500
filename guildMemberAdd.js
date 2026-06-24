const { EmbedBuilder } = require('discord.js');
const { handleJoin } = require('../systems/inviteSystem');
const { getUser } = require('../database/db');
const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Track invite
    await handleJoin(member).catch(() => {});

    // Ensure user in DB
    getUser(member.id);

    // Welcome message — find welcome channel
    const welcomeChannel =
      member.guild.channels.cache.find(c => c.name.includes('general') || c.name.includes('welcome'));
    if (!welcomeChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle('👋 Welcome to Roblox Launch Network!')
      .setDescription([
        `Welcome <@${member.id}>! We're glad you're here.`,
        '',
        '**Getting Started:**',
        '✅ Head to **#verify** to link your Roblox account',
        '📖 Read the **#rules** channel',
        '🎭 Pick your **ping roles** in **#roles** so you only get pinged for what you care about',
        '🎮 Join a **testing session** to earn XP & tokens',
        '👤 Set up your **developer profile** with `/setprofile`',
        '',
        '🩸 *The horror awaits...*',
      ].join('\n'))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: `Member #${member.guild.memberCount}` });

    welcomeChannel.send({ embeds: [embed] }).catch(() => {});
  },
};
