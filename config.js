require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  colors: {
    primary: 0x1a1a2e,
    accent: 0x00d4ff,
    danger: 0xdc143c,
    success: 0x00ff88,
    warning: 0xffaa00,
    horror: 0x8b0000,
    gold: 0xffd700,
    purple: 0x9b59b6,
  },

  xp: {
    message: { min: 15, max: 40 },
    voice: 10,
    invite: 100,
    session_attend: 200,
    feedback: 50,
    cooldown: 60000,
  },

  economy: {
    message: { min: 5, max: 15 },
    session: 100,
    invite: 50,
    daily: 200,
    weekly: 1000,
  },

  levels: {
    xpFormula: (level) => 5 * level * level + 50 * level + 100,
    roles: [
      { level: 5,  name: 'Active Tester',   color: 0x00ff88 },
      { level: 10, name: 'Verified Player',  color: 0x00d4ff },
      { level: 20, name: 'Trusted Tester',   color: 0x9b59b6 },
      { level: 35, name: 'Elite Tester',     color: 0xffaa00 },
      { level: 50, name: 'Launch Crew',      color: 0xdc143c },
    ],
  },

  inviteRewards: [
    { invites: 3,  role: 'Tester',         tokens: 50  },
    { invites: 10, role: 'Priority Access', tokens: 200 },
    { invites: 25, role: 'Event Host',      tokens: 500 },
  ],

  shop: [
    { id: 'badge_horror',    name: '🩸 Horror Badge',        price: 500,  type: 'badge'  },
    { id: 'badge_dev',       name: '⚙️ Dev Badge',           price: 750,  type: 'badge'  },
    { id: 'badge_elite',     name: '💎 Elite Badge',          price: 1000, type: 'badge'  },
    { id: 'spotlight_1h',    name: '🔦 1h Spotlight',         price: 300,  type: 'perk'   },
    { id: 'color_crimson',   name: '🔴 Crimson Name Color',   price: 400,  type: 'color'  },
    { id: 'color_blue',      name: '🔵 Neon Blue Name Color', price: 400,  type: 'color'  },
    { id: 'color_gold',      name: '🟡 Gold Name Color',      price: 600,  type: 'color'  },
  ],

  automod: {
    maxMentions: 5,
    maxLinks: 3,
    warnThreshold: 3,
    muteThreshold: 5,
    banThreshold: 7,
    spamWindow: 5000,
    spamMessages: 5,
    badWords: ['slur1', 'slur2'],
    allowedLinks: ['roblox.com', 'discord.gg', 'youtube.com', 'github.com'],
  },

  tickets: {
    types: [
      { id: 'support',      label: 'General Support',      emoji: '🎫', description: 'Get help with anything' },
      { id: 'report',       label: 'Report a User',        emoji: '🚨', description: 'Report rule violations' },
      { id: 'partnership',  label: 'Partnership',          emoji: '🤝', description: 'Business/collab inquiries' },
      { id: 'verify_help',  label: 'Verification Help',    emoji: '✅', description: 'Help with Roblox verification' },
      { id: 'session_help', label: 'Session Problems',     emoji: '🎮', description: 'Issues with testing sessions' },
    ],
  },

  sessionDefaults: {
    maxPlayers: 20,
    reminderMinutes: [30, 5],
  },

  dashboard: {
    port: parseInt(process.env.PORT) || parseInt(process.env.DASHBOARD_PORT) || 3000,
    secret: process.env.DASHBOARD_SECRET || 'changeme',
  },
};
