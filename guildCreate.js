const { cacheInvites } = require('../systems/inviteSystem');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    console.log(`[Bot] Joined guild: ${guild.name} (${guild.id})`);
    await cacheInvites(guild).catch(() => {});
  },
};
