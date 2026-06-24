const { PermissionFlagsBits } = require('discord.js');

function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isMod(member) {
  return member.permissions.has(PermissionFlagsBits.ManageMessages) || isAdmin(member);
}

function isStaff(member) {
  return member.permissions.has(PermissionFlagsBits.ManageRoles) || isMod(member);
}

function requireMod(interaction) {
  if (!isMod(interaction.member)) {
    return interaction.reply({ content: '❌ You need Moderator permissions to use this command.', ephemeral: true });
  }
  return null;
}

function requireAdmin(interaction) {
  if (!isAdmin(interaction.member)) {
    return interaction.reply({ content: '❌ You need Administrator permissions to use this command.', ephemeral: true });
  }
  return null;
}

module.exports = { isAdmin, isMod, isStaff, requireMod, requireAdmin };
