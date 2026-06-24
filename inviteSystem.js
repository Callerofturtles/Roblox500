const { run, get, all, addXP, addTokens } = require('../database/db');
const config = require('../config');

const inviteCache = new Map();

async function cacheInvites(guild) {
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return;
  inviteCache.set(guild.id, new Map(invites.map(i => [i.code, i.uses])));
}

async function handleJoin(member) {
  const guild = member.guild;
  const oldInvites = inviteCache.get(guild.id) || new Map();
  const newInvites = await guild.invites.fetch().catch(() => null);
  if (!newInvites) return;

  let usedInvite = null;
  for (const [code, invite] of newInvites) {
    const oldUses = oldInvites.get(code) || 0;
    if (invite.uses > oldUses) { usedInvite = invite; break; }
  }
  inviteCache.set(guild.id, new Map(newInvites.map(i => [i.code, i.uses])));
  if (!usedInvite?.inviter) return;

  const inviterId = usedInvite.inviter.id;
  run('INSERT OR IGNORE INTO invite_tracking (inviter_id, invitee_id) VALUES (?, ?)', [inviterId, member.id]);

  const row = get('SELECT COUNT(*) as cnt FROM invite_tracking WHERE inviter_id = ? AND left = 0', [inviterId]);
  const inviteCount = row?.cnt || 0;
  addXP(inviterId, config.xp.invite);
  addTokens(inviterId, config.economy.invite);

  for (const reward of config.inviteRewards) {
    if (inviteCount >= reward.invites) {
      const role = guild.roles.cache.find(r => r.name === reward.role);
      if (role) {
        const inviterMember = await guild.members.fetch(inviterId).catch(() => null);
        if (inviterMember && !inviterMember.roles.cache.has(role.id)) {
          await inviterMember.roles.add(role).catch(() => {});
        }
      }
    }
  }
}

async function handleLeave(member) {
  run('UPDATE invite_tracking SET left = 1 WHERE invitee_id = ?', [member.id]);
  inviteCache.delete(member.guild.id);
  await cacheInvites(member.guild);
}

function getInviteStats(userId) {
  const total = get('SELECT COUNT(*) as cnt FROM invite_tracking WHERE inviter_id = ?', [userId])?.cnt || 0;
  const active = get('SELECT COUNT(*) as cnt FROM invite_tracking WHERE inviter_id = ? AND left = 0', [userId])?.cnt || 0;
  return { total, active, left: total - active };
}

module.exports = { cacheInvites, handleJoin, handleLeave, getInviteStats };
