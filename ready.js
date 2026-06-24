const { ActivityType } = require('discord.js');
const { cacheInvites } = require('../systems/inviteSystem');
const { get, all, run } = require('../database/db');
const cron = require('node-cron');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[Bot] Logged in as ${client.user.tag}`);

    client.user.setPresence({
      activities: [{ name: '🎮 Roblox Launch Network', type: ActivityType.Watching }],
      status: 'online',
    });

    for (const guild of client.guilds.cache.values()) {
      await cacheInvites(guild).catch(() => {});
    }

    const statuses = [
      { name: '🎮 Roblox Launch Network', type: ActivityType.Watching },
      { name: '/session create', type: ActivityType.Listening },
      { name: '16+ Roblox Testing', type: ActivityType.Competing },
      { name: '/rank', type: ActivityType.Listening },
    ];
    let statusIdx = 0;
    setInterval(() => {
      statusIdx = (statusIdx + 1) % statuses.length;
      client.user.setActivity(statuses[statusIdx]);
    }, 300000);

    // End expired giveaways + polls every minute
    cron.schedule('* * * * *', async () => {
      const now = Math.floor(Date.now() / 1000);
      const { safeJSON } = require('../utils/helpers');

      const expiredGiveaways = all('SELECT * FROM giveaways WHERE ended = 0 AND end_time <= ?', [now]);
      for (const g of expiredGiveaways) {
        run('UPDATE giveaways SET ended = 1 WHERE id = ?', [g.id]);
        const entries = safeJSON(g.entries, []);
        const channel = await client.channels.fetch(g.channel_id).catch(() => null);
        if (!channel) continue;
        if (!entries.length) { channel.send(`🎉 Giveaway for **${g.prize}** ended with no entries.`); continue; }
        const winners = [];
        const pool = [...entries];
        for (let i = 0; i < Math.min(g.winners_count, pool.length); i++) {
          const idx = Math.floor(Math.random() * pool.length);
          winners.push(pool.splice(idx, 1)[0]);
        }
        channel.send(`🎉 **${g.prize}** winners: ${winners.map(w => `<@${w}>`).join(', ')}! Congratulations!`);
      }

      const expiredPolls = all('SELECT * FROM polls WHERE ended = 0 AND end_time <= ?', [now]);
      for (const poll of expiredPolls) {
        run('UPDATE polls SET ended = 1 WHERE id = ?', [poll.id]);
        const { EmbedBuilder } = require('discord.js');
        const config = require('../config');
        const options = JSON.parse(poll.options || '[]');
        const votes = JSON.parse(poll.votes || '{}');
        const channel = await client.channels.fetch(poll.channel_id).catch(() => null);
        if (!channel) continue;
        const results = options.map((o, i) => ({ option: o, votes: votes[i] || 0 })).sort((a, b) => b.votes - a.votes);
        const embed = new EmbedBuilder().setColor(config.colors.accent)
          .setTitle(`📊 Poll Results: ${poll.question}`)
          .setDescription(results.map((r, i) => `${i === 0 ? '🏆' : `**${i+1}.**`} ${r.option} — **${r.votes}** votes`).join('\n'))
          .setTimestamp();
        channel.send({ embeds: [embed] });
      }
    });

    console.log(`[Bot] Ready! Serving ${client.guilds.cache.size} guild(s)`);
  },
};
