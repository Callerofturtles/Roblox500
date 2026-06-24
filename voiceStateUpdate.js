const { handleVoiceJoin, handleVoiceLeave } = require('../systems/levelSystem');
const { run, get } = require('../database/db');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

const TEMP_VC_TRIGGER_NAME = '➕ Create VC';

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;

    if (!oldState.channel && newState.channel) {
      handleVoiceJoin(userId);
    } else if (oldState.channel && !newState.channel) {
      await handleVoiceLeave(userId, oldState.guild).catch(() => {});
    }

    const guild = newState.guild || oldState.guild;

    if (newState.channel?.name === TEMP_VC_TRIGGER_NAME) {
      try {
        const tempChannel = await guild.channels.create({
          name: `🎮 ${newState.member.displayName}'s VC`,
          type: ChannelType.GuildVoice,
          parent: newState.channel.parent,
          permissionOverwrites: [
            {
              id: newState.member.id,
              allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
            },
          ],
          userLimit: 10,
        });
        await newState.setChannel(tempChannel);
        run('INSERT OR REPLACE INTO temp_vc (channel_id, owner_id) VALUES (?, ?)', [tempChannel.id, userId]);
      } catch (e) {
        console.error('[TempVC]', e.message);
      }
    }

    if (oldState.channel) {
      const tempVC = get('SELECT * FROM temp_vc WHERE channel_id = ?', [oldState.channel.id]);
      if (tempVC && oldState.channel.members.size === 0) {
        await oldState.channel.delete().catch(() => {});
        run('DELETE FROM temp_vc WHERE channel_id = ?', [oldState.channel.id]);
      }
    }
  },
};
