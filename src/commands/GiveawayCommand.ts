import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  CommandInteractionOptionResolver,
  User,
  AttachmentBuilder,
} from "discord.js";
import { Command } from "../core/command/Command";
import { GiveawayHandler } from "../modules/giveaways/GiveawayHandler";
import GiveawayEmbeds from "../modules/giveaways/GiveawayEmbeds";

export class CreateGiveawayCommand implements Command {
  name = "creategiveaway";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Erstelle ein neues Giveaway")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("zeit")
        .setDescription("Dauer des Giveaways (z.B. 1h, 30m)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("preis")
        .setDescription("Preis des Giveaways")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("farbe")
        .setDescription("Farbe des Embeds (optional)")
        .setRequired(false),
    )
    .addAttachmentOption((option) =>
      option
        .setName("bild")
        .setDescription("Bild für das Giveaway (optional)")
        .setRequired(false),
    );

  async execute(interaction: CommandInteraction): Promise<void> {
    const options = interaction.options as CommandInteractionOptionResolver;
    const time = options.getString("zeit", true);
    const prize = options.getString("preis", true);
    const color = options.getString("farbe") || undefined;
    const attachment = options.getAttachment("bild");

    const duration = parseDuration(time);
    if (!duration) {
      const errorEmbed = GiveawayEmbeds.createErrorEmbed(
        "Ungültiges Dauerformat.",
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      return;
    }

    const thumbnailURL = attachment ? attachment.url : undefined;

    try {
      const giveaway = await GiveawayHandler.createGiveaway(
        interaction.guildId!,
        interaction.channelId,
        prize,
        duration,
        color,
        interaction.user,
        thumbnailURL, // Pass thumbnailURL here
      );

      await interaction.reply({
        content: `Dein Giveaway wurde erstellt! Die Giveaway-ID ist: \`${giveaway.id}\``,
        ephemeral: true,
      });
    } catch (error: any) {
      const errorEmbed = GiveawayEmbeds.createErrorEmbed(
        "Fehler beim Erstellen des Giveaways.",
      );
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      console.error(error);
    }
  }
}

function parseDuration(time: string): number | null {
  const match = /^(\d+)(s|m|h|d)$/.exec(time);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
