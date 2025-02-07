import {
  Client,
  ButtonInteraction,
  TextChannel,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Message,
  User,
} from "discord.js";
import { GiveawaySchema } from "./GiveawaySchema";
import { GiveawayCollection } from "./GiveawayCollection";
import GiveawayEmbeds from "./GiveawayEmbeds";

export class GiveawayHandler {
  private static client: Client;
  private static giveawayCollection = new GiveawayCollection();
  private static giveawayTimeouts: Record<string, NodeJS.Timeout> = {};

  static initialize(clientInstance: Client) {
    this.client = clientInstance;
    this.setupListeners();
  }

  static setupListeners() {
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;
      const [action, giveawayId] = interaction.customId.split("_");
      switch (action) {
        case "join":
          await this.joinGiveaway(interaction, giveawayId);
          break;
        case "leave":
          await this.leaveGiveaway(interaction, giveawayId);
          break;
        default:
          break;
      }
    });
  }

  static async createGiveaway(
    guildId: string,
    channelId: string,
    prize: string,
    duration: number,
    color: string | undefined,
    creator: User,
    thumbnailURL?: string,
  ): Promise<GiveawaySchema> {
    const giveaway: GiveawaySchema = {
      id: this.generateGiveawayId(),
      guildId,
      channelId,
      prize,
      duration,
      theme: "Default Theme",
      participants: [],
      endTime: Date.now() + duration,
      messageId: "",
      creatorId: creator.id,
      color,
      thumbnailURL,
    };

    const channel = await this.client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) {
      const textChannel = channel as TextChannel;
      const embed = GiveawayEmbeds.createGiveawayStartEmbed(
        prize,
        giveaway.id,
        giveaway.endTime,
        textChannel.guild.iconURL(),
        creator.username,
        creator.displayAvatarURL({ extension: "gif" }),
        color,
        giveaway.participants.length,
        thumbnailURL,
      );

      const joinButton = new ButtonBuilder()
        .setCustomId(`join_${giveaway.id}`)
        .setLabel("🎁 Giveaway beitreten")
        .setStyle(ButtonStyle.Success);

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        joinButton,
      );

      const giveawayMessage: Message = await textChannel.send({
        embeds: [embed],
        components: [actionRow],
      });
      giveaway.messageId = giveawayMessage.id;

      await this.giveawayCollection.createGiveaway(giveaway);

      this.giveawayTimeouts[giveaway.id] = setTimeout(() => {
        this.endGiveaway(giveaway.id);
      }, duration);
    } else {
      console.error("Channel is not text-based or not found.");
    }

    return giveaway;
  }

  private static async endGiveaway(giveawayId: string) {
    const giveaway = await this.giveawayCollection.getGiveaway(giveawayId);
    if (!giveaway) return;
    const channel = await this.client.channels.fetch(giveaway.channelId);
    if (!channel || !channel.isTextBased()) {
      console.error("Giveaway channel not found or is not text-based.");
      return;
    }

    const textChannel = channel as TextChannel;

    if (giveaway.participants.length === 0) {
      const noParticipantsEmbed = GiveawayEmbeds.createNoParticipantsEmbed(
        giveaway.prize,
        giveaway.id,
        textChannel.guild.iconURL(),
      );
      await textChannel.send({ embeds: [noParticipantsEmbed] });
      await this.giveawayCollection.deleteGiveaway(giveawayId);
      return;
    }

    const winner =
      giveaway.participants[
        Math.floor(Math.random() * giveaway.participants.length)
      ];
    const endEmbed = GiveawayEmbeds.createGiveawayEndEmbed(
      giveaway.prize,
      winner,
      giveaway.id,
      textChannel.guild.iconURL(),
      giveaway.participants,
    );

    await textChannel.send({ embeds: [endEmbed] });
    await this.giveawayCollection.deleteGiveaway(giveawayId);
  }

  static async endGiveawayEarly(giveawayId: string): Promise<void> {
    if (this.giveawayTimeouts[giveawayId]) {
      clearTimeout(this.giveawayTimeouts[giveawayId]);
      delete this.giveawayTimeouts[giveawayId];
    }
    await this.endGiveaway(giveawayId);
  }

  static async joinGiveaway(
    interaction: ButtonInteraction,
    giveawayId: string,
  ): Promise<boolean> {
    const giveaway = await this.giveawayCollection.getGiveaway(giveawayId);
    if (!giveaway) return false;

    if (!giveaway.participants.includes(interaction.user.id)) {
      giveaway.participants.push(interaction.user.id);
      await this.giveawayCollection.updateGiveaway(giveawayId, giveaway);

      const channel = await this.client.channels.fetch(giveaway.channelId);
      if (channel && channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        const message = await textChannel.messages.fetch(giveaway.messageId);
        const creator = await this.client.users.fetch(giveaway.creatorId);

        const updatedEmbed = GiveawayEmbeds.createGiveawayStartEmbed(
          giveaway.prize,
          giveaway.id,
          giveaway.endTime,
          textChannel.guild.iconURL(),
          creator.username,
          creator.displayAvatarURL({ extension: "gif" }),
          giveaway.color,
          giveaway.participants.length,
          giveaway.thumbnailURL,
        );

        await message.edit({ embeds: [updatedEmbed] });
      }
    }

    await interaction.reply({
      content: "Du hast am Giveaway teilgenommen!",
      ephemeral: true,
    });
    return true;
  }

  static async leaveGiveaway(
    interaction: ButtonInteraction,
    giveawayId: string,
  ): Promise<boolean> {
    try {
      const giveaway = await this.giveawayCollection.getGiveaway(giveawayId);
      if (!giveaway) return false;

      const userIndex = giveaway.participants.indexOf(interaction.user.id);
      if (userIndex > -1) {
        giveaway.participants.splice(userIndex, 1);
        await this.giveawayCollection.updateGiveaway(giveawayId, giveaway);
      }

      const channel = await this.client.channels.fetch(giveaway.channelId);
      if (channel && channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        const message = await textChannel.messages.fetch(giveaway.messageId);
        const creator = await this.client.users.fetch(giveaway.creatorId);

        const updatedEmbed = GiveawayEmbeds.createGiveawayStartEmbed(
          giveaway.prize,
          giveaway.id,
          giveaway.endTime,
          textChannel.guild.iconURL(),
          creator.username,
          creator.displayAvatarURL({ extension: "gif" }),
          giveaway.color,
          giveaway.participants.length,
          giveaway.thumbnailURL,
        );

        await message.edit({ embeds: [updatedEmbed] });
      }

      const successEmbed = GiveawayEmbeds.createSuccessEmbed(
        "Du hast das Giveaway erfolgreich verlassen. Du kannst erneut teilnehmen.",
      );
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });

      return true;
    } catch (error) {
      console.error("Failed to update giveaway embed:", error);
      return false;
    }
  }

  static async rollWinner(giveawayId: string): Promise<string | null> {
    const giveaway = await this.giveawayCollection.getGiveaway(giveawayId);
    if (!giveaway || giveaway.participants.length === 0) return null;
    const winner =
      giveaway.participants[
        Math.floor(Math.random() * giveaway.participants.length)
      ];
    return winner;
  }

  private static generateGiveawayId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
