require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      loadCommands(full);
    } else if (item.endsWith('.js')) {
      const cmd = require(full);
      if (cmd.data) commands.push(cmd.data.toJSON());
    }
  }
}

loadCommands(commandsPath);

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`[Deploy] Registering ${commands.length} slash commands...`);
    const data = await rest.put(
      process.env.GUILD_ID
        ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
        : Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log(`[Deploy] ✅ Successfully registered ${data.length} commands!`);
    commands.forEach(c => console.log(`  /${c.name}`));
  } catch (err) {
    console.error('[Deploy] ❌ Error:', err);
  }
})();
