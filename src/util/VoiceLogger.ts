import { EmbedBuilder, TextChannel, VoiceState } from "discord.js";
import Logger from "./logger";
import client from "../bot";
import dotenv from "dotenv";
dotenv.config();

const logger = new Logger(client);
const logChannelId = process.env.LOG_CHAT!;

class VoiceLogger {
  static async logVoiceStateUpdate(
    logger: Logger,
    oldState: VoiceState,
    newState: VoiceState,
  ) {
    const member = newState.member;
    if (!member) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (oldChannel === newChannel) return;

    let title = "Voice Channel Status Changed";
    let color = newChannel ? 0x00ff00 : 0xff0000;
    let description = `${member.user.tag} has ${newChannel ? "joined" : "left"} a voice channel.`;

    if (oldChannel && newChannel) {
      title = "Voice Channel Moved";
      color = 0xffff00;
      description = `${member.user.tag} moved from **${oldChannel.name}** to **${newChannel.name}**.`;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .addFields(
        { name: "User", value: `<@!${member.id}>`, inline: true },
        {
          name: "Before",
          value: oldChannel ? `<#${oldChannel.id}>` : "Not in a channel",
          inline: true,
        },
        {
          name: "After",
          value: newChannel ? `<#${newChannel.id}>` : "Not in a channel",
          inline: true,
        },
      )
      .setColor(color)
      .setThumbnail(member.user.avatarURL() || "")
      .setTimestamp();

    const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  }
}

client.on(
  "voiceStateUpdate",
  async (oldState: VoiceState, newState: VoiceState) => {
    await VoiceLogger.logVoiceStateUpdate(logger, oldState, newState);
  },
);

export default VoiceLogger;
