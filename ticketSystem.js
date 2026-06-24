const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { run, get, lastInsertId } = require('../database/db');
const config = require('../config');

async function sendTicketPanel(channel) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle('🎫 Support Tickets')
    .setDescription('Need help? Click a button below to open a ticket.\n\nOur staff will assist you as soon as possible.')
    .addFields(config.tickets.types.map(t => ({ name: `${t.emoji} ${t.label}`, value: t.description, inline: true })))
    .setFooter({ text: 'Roblox Launch Network • Support System' })
    .setTimestamp();

  const chunks = [];
  for (let i = 0; i < config.tickets.types.length; i += 5) chunks.push(config.tickets.types.slice(i, i + 5));
  const rows = chunks.map(chunk => new ActionRowBuilder().addComponents(
    chunk.map(t => new ButtonBuilder().setCustomId(`ticket_create_${t.id}`).setLabel(t.label).setEmoji(t.emoji).setStyle(ButtonStyle.Secondary))
  ));
  await channel.send({ embeds: [embed], components: rows });
}

async function createTicket(interaction, type) {
  const existing = get('SELECT * FROM tickets WHERE user_id = ? AND status = ?', [interaction.user.id, 'open']);
  if (existing) return interaction.reply({ content: `❌ You already have an open ticket: <#${existing.channel_id}>`, ephemeral: true });

  const ticketType = config.tickets.types.find(t => t.id === type);
  const guild = interaction.guild;

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ],
    topic: `Ticket | ${ticketType?.label} | ${interaction.user.tag}`,
  });

  run('INSERT INTO tickets (user_id, type, channel_id) VALUES (?, ?, ?)', [interaction.user.id, type, channel.id]);
  const ticketId = lastInsertId();

  const embed = new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle(`${ticketType?.emoji || '🎫'} ${ticketType?.label || 'Support'} Ticket`)
    .setDescription(`Welcome <@${interaction.user.id}>!\n\nDescribe your issue and a staff member will assist you shortly.\n\n**Ticket ID:** #${ticketId}`)
    .setTimestamp().setFooter({ text: 'Roblox Launch Network' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_close_${ticketId}`).setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`ticket_transcript_${ticketId}`).setLabel('📋 Save Transcript').setStyle(ButtonStyle.Secondary),
  );

  await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
  await interaction.reply({ content: `✅ Your ticket has been created: ${channel}`, ephemeral: true });
}

async function closeTicket(interaction, ticketId) {
  const ticket = get('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

  const messages = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
  let transcript = `Ticket #${ticketId} — Closed by ${interaction.user.tag}\n${'='.repeat(60)}\n`;
  if (messages) {
    const sorted = [...messages.values()].reverse();
    for (const msg of sorted) transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}\n`;
  }

  run('UPDATE tickets SET status = ?, transcript = ?, closed_at = ? WHERE id = ?', ['closed', transcript, Math.floor(Date.now() / 1000), ticketId]);

  const embed = new EmbedBuilder()
    .setColor(config.colors.danger).setTitle('🔒 Ticket Closed')
    .setDescription(`Closed by <@${interaction.user.id}>. Channel deletes in 10 seconds.`).setTimestamp();

  await interaction.reply({ embeds: [embed] });
  setTimeout(() => interaction.channel.delete().catch(() => {}), 10000);
}

module.exports = { sendTicketPanel, createTicket, closeTicket };
