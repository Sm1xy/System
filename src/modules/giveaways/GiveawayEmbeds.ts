import { EmbedBuilder, ColorResolvable } from "discord.js";

class GiveawayEmbeds {
  static createGiveawayStartEmbed(
    prize: string,
    giveawayId: string,
    endTime: number,
    guildIconURL: string | null,
    creatorDisplayName: string,
    creatorAvatarURL: string,
    color?: string,
    participantCount: number = 0,
    thumbnailURL?: string,
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle("🎉 Giveaway gestartet! 🎉")
      .setDescription(`**Preis:** ${prize}`)
      .setColor(color ? parseColor(color) : "#663399")
      .setThumbnail(
        thumbnailURL || guildIconURL || "https://example.com/default-guild.png",
      ) // Thumbnail korrekt setzen
      .addFields(
        {
          name: "Endet am",
          value: `<t:${Math.floor(endTime / 1000)}:F>`,
          inline: true,
        },
        {
          name: "Teilnehmer",
          value: `${participantCount} Teilnehmer`,
          inline: false,
        },
      )
      .setFooter({
        text: `Erstellt von: ${creatorDisplayName}`,
        iconURL: creatorAvatarURL,
      });
  }

  static createGiveawayEndEmbed(
    prize: string,
    winnerId: string,
    giveawayId: string,
    guildIconURL: string | null,
    participants: string[],
    color?: string,
    thumbnailURL?: string,
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle("🎉 Giveaway beendet! 🎉")
      .setDescription(`**Preis:** ${prize}`)
      .setColor(color ? parseColor(color) : "#663399")
      .setThumbnail(
        thumbnailURL || guildIconURL || "https://example.com/default-guild.png",
      )
      .addFields(
        { name: "Gewinner", value: `<@${winnerId}>`, inline: true },
        {
          name: "Teilnehmer",
          value: `${participants.length} Teilnehmer`,
          inline: false,
        },
      )
      .setFooter({ text: `Giveaway ID: ${giveawayId}` });
  }

  static createNoParticipantsEmbed(
    prize: string,
    giveawayId: string,
    guildIconURL: string | null,
    color?: string,
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle("🎉 Giveaway beendet! 🎉")
      .setDescription(
        `**Preis:** ${prize}\nLeider haben keine Teilnehmer am Giveaway teilgenommen.`,
      )
      .setColor(color ? parseColor(color) : "#663399")
      .setThumbnail(guildIconURL || "https://example.com/default-guild.png")
      .setTimestamp();
  }

  static createErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle("❌ Fehler")
      .setDescription(message)
      .setColor("#FF0000")
      .setTimestamp();
  }

  static createSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Erfolgreich")
      .setDescription(message);
  }
}

function parseColor(color: string): ColorResolvable {
  if (/^#[0-9A-F]{6}$/i.test(color)) {
    return parseInt(color.slice(1), 16);
  }
  return color as ColorResolvable;
}

export default GiveawayEmbeds;
