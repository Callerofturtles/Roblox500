const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../config');

const categories = {
  '🎮 Gaming': {
    description: 'Sessions, queue, games & matchmaking',
    commands: [
      { name: '/session create', desc: 'Host a Roblox testing session' },
      { name: '/session join/leave', desc: 'Join or leave a session' },
      { name: '/session list', desc: 'Browse open sessions' },
      { name: '/queue submit <gameId>', desc: 'Submit your game for testing (needs 500+ points)' },
      { name: '/queue view', desc: 'See your queue rank & position' },
      { name: '/queue position', desc: 'Full queue leaderboard' },
      { name: '/promote <gameId>', desc: 'Promote your Roblox game' },
      { name: '/games', desc: 'Browse promoted games' },
      { name: '/lookingfor post/find', desc: 'Find collaborators or post your skills' },
    ],
  },
  '⭐ Levels & Economy': {
    description: 'XP, tokens, ranks & rewards',
    commands: [
      { name: '/rank', desc: 'View your XP level & progress' },
      { name: '/leaderboard', desc: 'XP, token, or invite leaderboard' },
      { name: '/levels', desc: 'See all level roles & XP requirements' },
      { name: '/balance', desc: 'Check your token balance' },
      { name: '/daily', desc: 'Claim daily token reward' },
      { name: '/weekly', desc: 'Claim your weekly token reward' },
      { name: '/shop', desc: 'Browse the token shop' },
      { name: '/buy <item>', desc: 'Purchase a shop item' },
      { name: '/feedback <sessionId>', desc: 'Give session feedback & earn XP/tokens' },
    ],
  },
  '👤 Profile & Social': {
    description: 'Profiles, reputation & invites',
    commands: [
      { name: '/profile', desc: 'View a developer profile' },
      { name: '/setprofile', desc: 'Set up your developer profile' },
      { name: '/rep', desc: 'Give reputation to a user (once/day)' },
      { name: '/invites', desc: 'Check invite stats' },
      { name: '/inviteleaderboard', desc: 'Top inviters leaderboard' },
      { name: '/verify', desc: 'Link your Roblox account via Bloxlink' },
    ],
  },
  '🎉 Community': {
    description: 'Events, polls & giveaways',
    commands: [
      { name: '/event create', desc: 'Create a server event' },
      { name: '/event list', desc: 'Upcoming events' },
      { name: '/giveaway start', desc: 'Start a giveaway' },
      { name: '/poll', desc: 'Create a poll' },
      { name: '/suggest', desc: 'Submit a server suggestion' },
    ],
  },
  '🔨 Moderation': {
    description: 'Mod tools (staff only)',
    commands: [
      { name: '/ban', desc: 'Ban a member' },
      { name: '/kick', desc: 'Kick a member' },
      { name: '/warn', desc: 'Warn a member' },
      { name: '/mute', desc: 'Timeout a member' },
      { name: '/slowmode', desc: 'Set channel slowmode' },
      { name: '/modlogs', desc: 'View a user\'s moderation history' },
    ],
  },
  '⚙️ Admin': {
    description: 'Server setup (admins only)',
    commands: [
      { name: '/setup server', desc: 'Auto-create all channels & categories' },
      { name: '/setup tickets', desc: 'Send the ticket panel to a channel' },
      { name: '/setup verify', desc: 'Send the verification panel' },
      { name: '/setup roles', desc: 'Send the ping role picker panel' },
      { name: '/announce', desc: 'Send a formatted announcement' },
      { name: '/give', desc: 'Give XP or tokens to a user' },
      { name: '/queue list', desc: 'View pending game submissions' },
      { name: '/queue approve/deny', desc: 'Approve or deny a game submission' },
    ],
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Browse all bot commands')
    .addStringOption(o => o.setName('category').setDescription('Jump to a specific category').addChoices(
      { name: '🎮 Gaming', value: 'gaming' },
      { name: '⭐ Levels & Economy', value: 'economy' },
      { name: '👤 Profile & Social', value: 'social' },
      { name: '🎉 Community', value: 'community' },
      { name: '🔨 Moderation', value: 'moderation' },
      { name: '⚙️ Admin', value: 'admin' },
    )),

  async execute(interaction) {
    const choice = interaction.options.getString('category');
    const categoryMap = {
      gaming: '🎮 Gaming',
      economy: '⭐ Levels & Economy',
      social: '👤 Profile & Social',
      community: '🎉 Community',
      moderation: '🔨 Moderation',
      admin: '⚙️ Admin',
    };

    if (choice) {
      const cat = categories[categoryMap[choice]];
      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle(`${categoryMap[choice]} Commands`)
        .setDescription(cat.description)
        .addFields(cat.commands.map(c => ({ name: c.name, value: c.desc, inline: false })))
        .setFooter({ text: 'Roblox Launch Network • /help for all categories' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Overview of all categories
    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle('📖 Roblox Launch Network — Command Help')
      .setDescription('Use `/help category:<name>` to see commands for a specific category.')
      .addFields(
        Object.entries(categories).map(([name, cat]) => ({
          name,
          value: `${cat.description}\n${cat.commands.slice(0, 3).map(c => `\`${c.name}\``).join(' ')}...`,
          inline: false,
        }))
      )
      .setFooter({ text: '🎮 Roblox Launch Network Bot • Use /help category:name for details' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
