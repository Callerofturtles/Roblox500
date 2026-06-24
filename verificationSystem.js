const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { run } = require('../database/db');
const config = require('../config');

async function sendVerificationPanel(channel) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle('✅ Roblox Verification')
    .setDescription([
      '**Verify your Roblox account to unlock full access!**',
      '',
      'Use the Bloxlink bot to verify:',
      '> Type `/verify` in any channel',
      '> Follow the steps to link your Roblox account',
      '> You\'re done! ✅',
      '',
      '**Already verified on Bloxlink?**',
      'Click the button below to claim your Verified role.',
    ].join('\n'))
    .setFooter({ text: 'Roblox Launch Network • Powered by Bloxlink' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_start')
      .setLabel('✅ I\'ve verified — give me my role!')
      .setStyle(ButtonStyle.Success)
  );
  await channel.send({ embeds: [embed], components: [row] });
}

async function startVerification(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if Bloxlink has this user in the guild
    const axios = require('axios');
    const res = await axios.get(
      `https://api.blox.link/v4/public/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.user.id}`,
      { headers: { 'Authorization': process.env.BLOXLINK_API_KEY || '' } }
    ).catch(() => null);

    const robloxId = res?.data?.robloxID;

    if (!robloxId) {
      return interaction.editReply({
        content: [
          '❌ **Not verified on Bloxlink yet.**',
          '',
          'Type `/verify` in any channel to link your Roblox account via Bloxlink, then come back and click this button again!',
        ].join('\n'),
      });
    }

    // Get Roblox username
    const profileRes = await axios.get(`https://users.roblox.com/v1/users/${robloxId}`).catch(() => null);
    const username = profileRes?.data?.name || `User#${robloxId}`;

    // Save to DB
    run('UPDATE users SET roblox_username = ?, roblox_verified = 1 WHERE id = ?', [username, interaction.user.id]);

    // Give Verified role
    let verifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Verified');
    if (!verifiedRole) {
      verifiedRole = await interaction.guild.roles.create({
        name: 'Verified',
        color: 0x00ff88,
        reason: 'Auto-created for Roblox verification',
      }).catch(() => null);
    }
    if (verifiedRole) await interaction.member.roles.add(verifiedRole).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Verified!')
      .setDescription(`You're now verified as **${username}** and have full server access!`)
      .setFooter({ text: 'Roblox Launch Network' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (e) {
    console.error('[Verify]', e.message);
    // If no API key or API fails, just give them the role based on trust
    let verifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Verified');
    if (!verifiedRole) {
      verifiedRole = await interaction.guild.roles.create({
        name: 'Verified',
        color: 0x00ff88,
        reason: 'Auto-created for Roblox verification',
      }).catch(() => null);
    }
    if (verifiedRole) await interaction.member.roles.add(verifiedRole).catch(() => {});
    await interaction.editReply({ content: '✅ Role granted! Make sure you\'ve verified with Bloxlink using `/verify`.' });
  }
}

async function confirmVerification(interaction) {
  return startVerification(interaction);
}

module.exports = { sendVerificationPanel, startVerification, confirmVerification, pendingVerifications: new Map() };
