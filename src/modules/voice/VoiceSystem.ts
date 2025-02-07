import {
  Client,
  GuildMember,
  VoiceChannel,
  VoiceState,
  PermissionFlagsBits,
  ChannelType,
  CategoryChannel,
  Interaction,
} from "discord.js";
import Logger from "../../util/logger";
import VoiceCollection from "../voice/VoiceCollection";

export class VoiceSystem {
  private static instance: VoiceSystem | null = null;
  private logger: Logger;
  private client: Client;
  private monitoredChannels: Set<string>;
  private voiceCollection: VoiceCollection;

  private constructor(client: Client, logger: Logger) {
    this.client = client;
    this.logger = logger;
    this.monitoredChannels = new Set<string>();
    this.voiceCollection = new VoiceCollection();

    this.client.on("voiceStateUpdate", this.onVoiceStateUpdate.bind(this));
    this.client.on("interactionCreate", this.onInteractionCreate.bind(this));

    this.loadMonitoredChannels();
  }

  public static getInstance(client: Client, logger: Logger): VoiceSystem {
    if (!VoiceSystem.instance) {
      VoiceSystem.instance = new VoiceSystem(client, logger);
    }
    return VoiceSystem.instance;
  }
  public async addMonitoredChannel(channelId: string): Promise<void> {
    this.monitoredChannels.add(channelId);
    this.logger.info(`Jetzt wird der Channel mit ID: ${channelId} überwacht.`);
  }

  /**
   * Remove a channel from being monitored.
   * @param channelId The ID of the channel to remove.
   */
  public async removeMonitoredChannel(channelId: string): Promise<void> {
    this.monitoredChannels.delete(channelId);
    await this.voiceCollection.deleteVoiceChannel(
      this.client.guilds.cache.first()!.id,
      channelId,
    );
    this.logger.info(
      `Channel mit ID: ${channelId} wird nicht mehr überwacht und wurde aus der Datenbank gelöscht.`,
    );
  }

  /**
   * Load monitored channels.
   */
  private async loadMonitoredChannels(): Promise<void> {
    const guild = this.client.guilds.cache.first();
    if (!guild) {
      this.logger.error("No guild found.");
      return;
    }
    const channels = await this.voiceCollection.getAllVoiceChannels(guild.id);
    channels.forEach((channel) =>
      this.monitoredChannels.add(channel.channelId),
    );
    this.logger.info(
      `Loaded ${channels.length} monitored voice channels from the database.`,
    );
  }

  /**
   * Check if a voice channel is already being monitored.
   * @param channelId The ID of the voice channel.
   * @returns True if monitored, else false.
   */
  public isMonitored(channelId: string): boolean {
    return this.monitoredChannels.has(channelId);
  }

  /**
   * Handle interaction events, specifically for removing voice system setups.
   * @param interaction The interaction event.
   */
  private async onInteractionCreate(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("remove_voice_setup_")) {
      const channelId = interaction.customId.replace("remove_voice_setup_", "");
      if (this.monitoredChannels.has(channelId)) {
        await this.removeMonitoredChannel(channelId);
        await interaction.reply({
          content: `Voice system von <#${channelId}> wurde entfernt.`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `Voice system von <#${channelId}> ist nicht mehr aktiv.`,
          ephemeral: true,
        });
      }
    }
  }

  /**
   * Handle voice state updates to manage personal voice channels.
   * @param oldState The previous voice state.
   * @param newState The new voice state.
   */
  private async onVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    const guild = newState.guild;

    // User joins a monitored voice channel
    if (
      newState.channelId &&
      this.monitoredChannels.has(newState.channelId) &&
      oldState.channelId !== newState.channelId
    ) {
      const member = newState.member;
      if (member) {
        // Check if the user already has a personal voice channel
        const existingChannel = guild.channels.cache.find(
          (channel) =>
            channel.type === ChannelType.GuildVoice &&
            channel.name === `🔊・Talk von ${member.user.displayName}`,
        ) as VoiceChannel | undefined;

        if (existingChannel) {
          try {
            await member.voice.setChannel(existingChannel);
            this.logger.info(
              `User ${member.user.tag} wurde in seinen eigenen Voice-Kanal verschoben: ${existingChannel.name}.`,
            );
          } catch {
            this.logger.warn(
              `Konnte ${member.user.tag} nicht in seinen eigenen Voice-Kanal verschieben.`,
            );
          }
          return;
        }

        // Get the parent category of the monitored channel
        const monitoredChannel = guild.channels.cache.get(
          newState.channelId,
        ) as VoiceChannel;
        const parent = monitoredChannel.parent as CategoryChannel | undefined;

        if (parent) {
          await this.createUserChannel(member, parent);
        } else {
          this.logger.warn(
            `Monitored channel ${newState.channelId} has no parent category.`,
          );
        }
      }
    }

    // User leaves a voice channel
    if (oldState.channelId && !newState.channelId) {
      const oldChannel = oldState.channel as VoiceChannel;
      if (oldChannel && oldChannel.members.size === 0) {
        if (oldChannel.name.startsWith("🔊・Talk von ")) {
          try {
            await oldChannel.delete();
            this.logger.info(
              `Voice-Kanal ${oldChannel.name} wurde gelöscht, da keine Mitglieder mehr vorhanden sind.`,
            );
          } catch (error) {
            this.logger.error(
              `Fehler beim Löschen des Voice-Kanals ${oldChannel.name}: ${error}`,
            );
          }
        }
      }
    }
  }

  /**
   * Create a personal voice channel for a member.
   * @param member The guild member.
   * @param parent The category channel.
   */
  private async createUserChannel(
    member: GuildMember,
    parent: CategoryChannel,
  ): Promise<void> {
    try {
      const newChannel = await parent.guild.channels.create({
        name: `🔊・Talk von ${member.user.displayName}`,
        type: ChannelType.GuildVoice,
        parent: parent.id,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ViewChannel,
            ],
          },
          {
            id: parent.guild.roles.everyone,
            deny: [PermissionFlagsBits.Connect],
          },
        ],
      });

      await member.voice.setChannel(newChannel);
      this.logger.info(
        `Erstellte eigenen Voice-Kanal für ${member.user.tag}: ${newChannel.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Fehler beim Erstellen des Voice-Kanals für ${member.user.tag}: ${error}`,
      );
    }
  }
}

export default VoiceSystem;
