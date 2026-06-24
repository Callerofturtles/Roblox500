const { handleMessage } = require('../systems/levelSystem');
const automod = require('../systems/automod');
const { addTokens } = require('../database/db');
const { randomInt } = require('../utils/helpers');
const config = require('../config');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // AutoMod check
    await automod.check(message);

    // XP + Tokens from chat
    await handleMessage(message);
    addTokens(message.author.id, randomInt(config.economy.message.min, config.economy.message.max));
  },
};
