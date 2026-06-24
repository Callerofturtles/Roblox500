# 🩸 Roblox Launch Network — Setup Guide

## Quick Start (Replit)

### Step 1: Secrets (already done if you added them)
In Replit Secrets, make sure these are set:
- `BOT_TOKEN` — from Discord Developer Portal → Bot → Token
- `CLIENT_ID` — from Discord Developer Portal → OAuth2 → Client ID  
- `GUILD_ID` — your Discord server ID (right-click server → Copy Server ID)

### Step 2: Install Dependencies
The workflow does this automatically. Or run manually:
```bash
cd artifacts/discord-bot && npm install
```

### Step 3: Deploy Slash Commands
Run this **once** to register all slash commands with Discord:
```bash
cd artifacts/discord-bot && node deploy-commands.js
```

### Step 4: Start the Bot
The workflow starts the bot automatically. Or manually:
```bash
cd artifacts/discord-bot && node index.js
```

---

## Keeping the Bot Online (Replit)
- Use Replit's **Always On** feature (requires Replit Core/Hacker plan)
- Or use [UptimeRobot](https://uptimerobot.com) to ping your Replit URL every 5 minutes
- The dashboard runs on port 3000 — ping that URL to keep the repl alive

---

## Inviting the Bot to Your Server

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → **OAuth2** → **URL Generator**
3. Scopes: check `bot` and `applications.commands`
4. Bot Permissions: select:
   - Manage Roles
   - Manage Channels
   - Kick Members
   - Ban Members
   - Moderate Members (Timeout)
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Manage Messages
   - Add Reactions
   - Use External Emojis
   - Manage Guild
   - View Audit Log
   - Connect (Voice)
   - Move Members
5. Copy the generated URL and open it to invite the bot

---

## Server Setup (First Time)

After inviting the bot, run these commands in your Discord server:

### Auto-create all channels:
```
/setup server
```
This creates all 7 categories and all channels automatically.

### Send the verification panel:
```
/setup verify #verify
```

### Send the ticket system panel:
```
/setup tickets #tickets
```

---

## Required Discord Server Settings

### Enable Developer Mode:
User Settings → Advanced → Developer Mode ✅

### Enable Community (recommended):
Server Settings → Enable Community

### Intents to enable in Developer Portal:
Bot → Privileged Gateway Intents:
- ✅ Server Members Intent
- ✅ Message Content Intent
- ✅ Presence Intent

---

## Dashboard Access

The web dashboard runs at:
- **Development:** `http://localhost:3000`
- **Replit:** Your repl's public URL

When prompted, enter your `DASHBOARD_SECRET` value (set in config.js or as env var `DASHBOARD_SECRET`).

---

## All Commands

### Level System
| Command | Description |
|---------|-------------|
| `/rank` | View your XP rank card |
| `/rank [user]` | View another user's rank |
| `/leaderboard` | Server leaderboards (XP/Tokens/Invites) |
| `/levels` | View all level roles & XP requirements |

### Economy
| Command | Description |
|---------|-------------|
| `/balance` | Check token balance |
| `/daily` | Claim daily token reward (200 tokens) |
| `/weekly` | Claim weekly reward (1000 tokens) |
| `/shop` | Browse the token shop |
| `/buy <item>` | Purchase a shop item |

### Testing Sessions
| Command | Description |
|---------|-------------|
| `/session create` | Create a testing session |
| `/session join <id>` | Join a session |
| `/session leave <id>` | Leave a session |
| `/session end <id>` | End your session & distribute rewards |
| `/session list` | View open sessions |
| `/session info <id>` | View session details |

### Profiles
| Command | Description |
|---------|-------------|
| `/profile [user]` | View developer profile |
| `/setprofile` | Set up your profile |
| `/rep <user> <rating>` | Give reputation 1–5 stars |

### Invites
| Command | Description |
|---------|-------------|
| `/invites [user]` | Check invite stats |
| `/inviteleaderboard` | Top inviters |

### Matchmaking
| Command | Description |
|---------|-------------|
| `/lookingfor post` | Post your skills/availability |
| `/lookingfor find <role>` | Find collaborators |

### Games
| Command | Description |
|---------|-------------|
| `/promote` | Submit your Roblox game |
| `/games [genre]` | Browse promoted games |

### Events
| Command | Description |
|---------|-------------|
| `/event create` | Create a server event |
| `/event join <id>` | Join an event |
| `/event list` | View upcoming events |

### Verification
| Command | Description |
|---------|-------------|
| `/verify` | Link your Roblox account |

### Moderation
| Command | Description |
|---------|-------------|
| `/ban <user>` | Ban a member |
| `/kick <user>` | Kick a member |
| `/warn <user> <reason>` | Issue a warning |
| `/mute <user> <duration>` | Timeout a member |
| `/slowmode <seconds>` | Set channel slowmode |
| `/modlogs <user>` | View mod history |

### Admin
| Command | Description |
|---------|-------------|
| `/setup server` | Auto-create all channels |
| `/setup tickets #channel` | Deploy ticket panel |
| `/setup verify #channel` | Deploy verification panel |
| `/give <user> tokens/xp <amount>` | Give tokens or XP |

### Fun / Community
| Command | Description |
|---------|-------------|
| `/suggest <text>` | Submit a suggestion |
| `/poll <question> <options>` | Create a poll |
| `/giveaway start` | Start a giveaway |
| `/giveaway end <id>` | End a giveaway early |

---

## Level Roles (Auto-Created)

| Level | Role Name | Color |
|-------|-----------|-------|
| 5 | Active Tester | 🟢 Green |
| 10 | Verified Player | 🔵 Cyan |
| 20 | Trusted Tester | 🟣 Purple |
| 35 | Elite Tester | 🟠 Orange |
| 50 | Launch Crew | 🔴 Crimson |

## Invite Rewards (Auto-Applied)

| Invites | Role | Bonus |
|---------|------|-------|
| 3 | Tester | 50 tokens |
| 10 | Priority Access | 200 tokens |
| 25 | Event Host | 500 tokens |

---

## XP Sources

| Activity | XP Earned |
|----------|-----------|
| Message (1 min cooldown) | 15–40 XP |
| Voice activity | 10 XP/minute |
| Successful invite | 100 XP |
| Attend session | 200 XP |
| Post feedback | 50 XP |

## Token Sources

| Activity | Tokens |
|----------|--------|
| Message | 5–15 tokens |
| Daily claim | 200 tokens |
| Weekly claim | 1,000 tokens |
| Session attendance | 100 tokens |
| Invite someone | 50 tokens |

---

## Temp Voice Channels

Create a voice channel named exactly: `➕ Create VC`

When members join it, a private voice channel is automatically created for them and deleted when empty.

---

## Troubleshooting

**Bot not responding to commands?**
- Run `node deploy-commands.js` to register commands
- Check that Message Content Intent is enabled in Developer Portal
- Ensure bot has permissions in the channel

**Verification not working?**
- Roblox API is rate-limited; wait and retry
- User must have their profile **public** and About section visible

**Bot goes offline on Replit?**
- Enable Always On in Replit settings
- Or use UptimeRobot to ping the dashboard URL every 5 minutes

**Commands not appearing?**
- Guild commands appear instantly; global commands take up to 1 hour
- Make sure `GUILD_ID` is set for instant deployment

---

## File Structure

```
discord-bot/
├── index.js              — Main bot entry point
├── config.js             — All configuration
├── deploy-commands.js    — Register slash commands
├── package.json
├── commands/
│   ├── admin/            — setup, give
│   ├── economy/          — balance, shop, buy, daily, weekly
│   ├── events/           — event
│   ├── games/            — promote, games
│   ├── invites/          — invites, inviteleaderboard
│   ├── levels/           — rank, leaderboard, levels
│   ├── matchmaking/      — lookingfor
│   ├── misc/             — verify, suggest, poll, giveaway
│   ├── moderation/       — ban, kick, warn, mute, slowmode, modlogs
│   ├── profiles/         — profile, setprofile, rep
│   └── sessions/         — session
├── events/
│   ├── ready.js
│   ├── interactionCreate.js
│   ├── messageCreate.js
│   ├── guildMemberAdd.js
│   ├── guildMemberRemove.js
│   ├── voiceStateUpdate.js
│   └── guildCreate.js
├── systems/
│   ├── levelSystem.js
│   ├── inviteSystem.js
│   ├── sessionSystem.js
│   ├── ticketSystem.js
│   ├── automod.js
│   ├── verificationSystem.js
│   └── economySystem.js
├── database/
│   └── db.js             — SQLite (better-sqlite3)
├── dashboard/
│   └── server.js         — Express web dashboard
├── utils/
│   ├── embeds.js
│   ├── levels.js
│   ├── helpers.js
│   └── permissions.js
└── data/
    └── bot.db            — Created automatically on first run
```
