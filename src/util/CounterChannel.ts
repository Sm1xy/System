import {
  Client,
  Guild,
  VoiceChannel,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import Logger from "./logger";

class CounterChannel {
  private client: Client;
  private logger: Logger;

  constructor(client: Client, logger: Logger) {
    this.client = client;
    this.logger = logger;

    this.client.on("guildMemberAdd", (member) =>
      this.updateMemberCounter(member.guild),
    );
    this.client.on("guildMemberRemove", (member) =>
      this.updateMemberCounter(member.guild),
    );
  }

  public async createMemberCounter(guild: Guild): Promise<void> {
    const memberCount = guild.memberCount;
    const channelName = `👤・Mitglieder: ${memberCount}`;

    try {
      const existingChannel = guild.channels.cache.find(
        (channel) =>
          channel.type === ChannelType.GuildVoice &&
          channel.name.startsWith("👤・Mitglieder:"),
      ) as VoiceChannel | undefined;

      if (existingChannel) {
        await existingChannel.setName(channelName);
        this.logger.info(`Mitgliederzähler aktualisiert: ${channelName}`);
      } else {
        const newChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.Connect],
            },
          ],
        });
        this.logger.info(`Mitgliederzähler erstellt: ${newChannel.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Fehler beim Erstellen des Mitgliederzählers: ${error}`,
      );
      throw error;
    }
  }

  public async updateMemberCounter(guild: Guild): Promise<void> {
    const memberCount = guild.memberCount;
    const channelName = `👤・Mitglieder: ${memberCount}`;

    try {
      const existingChannel = guild.channels.cache.find(
        (channel) =>
          channel.type === ChannelType.GuildVoice &&
          channel.name.startsWith("👤・Mitglieder:"),
      ) as VoiceChannel | undefined;

      if (existingChannel) {
        await existingChannel.setName(channelName);
        this.logger.info(`Mitgliederzähler aktualisiert: ${channelName}`);
      }
    } catch (error) {
      this.logger.error(
        `Fehler beim Aktualisieren des Mitgliederzählers: ${error}`,
      );
    }
  }
}

export default CounterChannel;
