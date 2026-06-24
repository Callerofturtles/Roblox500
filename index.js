require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { init: initDB } = require('./database/db');
const config = require('./config');

if (!config.token) {
  console.error('[Bot] ❌ BOT_TOKEN is missing. Set it in your environment secrets.');
  process.exit(1);
}
if (!config.clientId) {
  console.error('[Bot] ❌ CLIENT_ID is missing. Set it in your environment secrets.');
  process.exit(1);
}

async function main() {
  await initDB();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });

  client.commands = new Collection();

  function loadCommands(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        loadCommands(full);
      } else if (item.endsWith('.js')) {
        try {
          const command = require(full);
          if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            console.log(`[Commands] Loaded /${command.data.name}`);
          }
        } catch (e) {
          console.error(`[Commands] Failed to load ${full}:`, e.message);
        }
      }
    }
  }

  loadCommands(path.join(__dirname, 'commands'));
  console.log(`[Commands] ${client.commands.size} commands loaded`);

  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`[Events] Loaded ${event.name}`);
  }

  process.on('unhandledRejection', (error) => {
    console.error('[Process] Unhandled rejection:', error);
  });

  process.on('uncaughtException', (error) => {
    console.error('[Process] Uncaught exception:', error);
  });

  client.on('error', (error) => {
    console.error('[Client] Error:', error);
  });

  console.log('[Bot] Connecting to Discord...');
  await client.login(config.token).catch((err) => {
    console.error('[Bot] ❌ Login failed:', err.message);
    process.exit(1);
  });
}

main().catch(err => {
  console.error('[Bot] Fatal startup error:', err);
  process.exit(1);
});
