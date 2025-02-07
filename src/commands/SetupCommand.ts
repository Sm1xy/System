import { Command } from "../core/command/Command";
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ChannelType,
  GuildChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { TicketSystem } from "../modules/tickets/TicketSystem";
import VoiceSystem from "../modules/voice/VoiceSystem";
import VoiceCollection from "../modules/voice/VoiceCollection";
import client from "../bot";
import { ObjectId } from "mongodb";
import Logger from "../util/logger";
import VoiceChannel, { IVoiceChannel } from "../modules/voice/VoiceSchema";
import CounterChannel from "../util/CounterChannel";

export class SetupCommand implements Command {
  name = "setup";
  private logger = new Logger(client);
  private monitoredChannels: Set<string> = new Set();
  private voiceCollection: VoiceCollection;

  constructor() {
    this.voiceCollection = new VoiceCollection();
  }

  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Set up various features")
    .addSubcommand((sub) =>
      sub
        .setName("ticket")
        .setDescription("Set up the ticket system")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Choose a ticket type")
            .setRequired(true)
            .addChoices(
              { name: "General", value: "General" },
              { name: "Bug Report", value: "BugReport" },
              { name: "PIC", value: "PIC" },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("voice")
        .setDescription("Set up the voice system")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The voice channel to monitor")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("membercounter")
        .setDescription("Set up a member counter voice channel"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "voice") {
      await this.setupVoiceSystem(interaction);
    } else if (subcommand === "ticket") {
      const type = interaction.options.getString("type", true);
      await TicketSystem.handleSetup(interaction, type);
    } else if (subcommand === "membercounter") {
      await this.setupMemberCounter(interaction);
    }
  }

  private async setupVoiceSystem(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    try {
      const channel = interaction.options.getChannel(
        "channel",
        true,
      ) as GuildChannel;

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        await interaction.reply({
          content: "Bitte wähle einen gültigen Sprachkanal.",
          ephemeral: true,
        });
        return;
      }

      const voiceSystem = VoiceSystem.getInstance(client, this.logger);

      if (voiceSystem.isMonitored(channel.id)) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`remove_voice_setup_${channel.id}`)
            .setLabel("Entfernen")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`cancel_remove_voice_setup_${channel.id}`)
            .setLabel("Abbrechen")
            .setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({
          content: `Der Voice System ist bereits auf <#${channel.id}> eingerichtet. Möchtest du es entfernen?`,
          components: [row],
          ephemeral: true,
        });
      } else {
        await voiceSystem.addMonitoredChannel(channel.id);
        const voiceChannel: IVoiceChannel = new VoiceChannel({
          _id: new ObjectId(),
          channelId: channel.id,
          guildId: interaction.guildId!,
          // Add other required properties here
        });
        await this.voiceCollection.createVoiceChannel(voiceChannel);
        await interaction.reply({
          content: `Voice-System wurde eingerichtet und überwacht den Kanal: <#${channel.id}> ✅`,
          ephemeral: true,
        });
      }
    } catch (error) {
      await interaction.reply({
        content: "Es gab einen Fehler bei der Einrichtung des Voice Systems.",
        ephemeral: true,
      });
      this.logger.error(`Setup Voice System Error: ${error}`);
    }
  }

  private async setupMemberCounter(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    try {
      const counterChannel = new CounterChannel(client, this.logger);
      await counterChannel.createMemberCounter(interaction.guild!);
      await interaction.reply({
        content: "Mitgliederzähler wurde erfolgreich erstellt! ✅",
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: "Es gab einen Fehler beim Erstellen des Mitgliederzählers.",
        ephemeral: true,
      });
      this.logger.error(`Setup Member Counter Error: ${error}`);
    }
  }

  public async removeMonitoredChannel(channelId: string): Promise<void> {
    this.monitoredChannels.delete(channelId);
    await this.voiceCollection.deleteVoiceChannel(
      client.guilds.cache.first()!.id,
      channelId,
    );
    this.logger.info(
      `Channel mit ID: ${channelId} wird nicht mehr überwacht und wurde aus der Datenbank gelöscht.`,
    );
  }
}
