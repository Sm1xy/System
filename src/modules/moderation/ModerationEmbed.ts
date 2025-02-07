import { CommandInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { formatDuration } from "../../util/DurationHandler";

export function privateMuteEmbed(
  duration: number,
  reason: string,
): EmbedBuilder {
  const formattedDuration = formatDuration(duration);
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("Du wurdest gemutet")
    .addFields(
      { name: "Dauer", value: formattedDuration, inline: true },
      {
        name: "Endet",
        value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`,
        inline: true,
      },
      { name: "Grund", value: reason, inline: false },
    );
}

export function muteEmbed(
  member: GuildMember,
  interaction: CommandInteraction,
  duration: number,
  reason: string,
): EmbedBuilder {
  const formattedDuration = formatDuration(duration);
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("Mute")
    .setThumbnail(member.user.avatarURL())
    .addFields(
      { name: "User", value: `<@${member.id}>`, inline: true },
      {
        name: "Von",
        value: `<@${interaction.user.id}>`,
        inline: true,
      },
      { name: "Dauer", value: formattedDuration, inline: true },
      {
        name: "Endet",
        value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`,
        inline: true,
      },
      { name: "Grund", value: reason, inline: false },
    );
}

export function privateUnmuteEmbed(reason: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("Du wurdest entmutet")
    .addFields({ name: "Grund", value: reason, inline: false });
}

export function unmuteEmbed(
  member: GuildMember,
  interaction: CommandInteraction,
  reason: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("Unmute")
    .setThumbnail(member.user.avatarURL())
    .addFields(
      { name: "User", value: `<@${member.id}>`, inline: true },
      {
        name: "Von",
        value: `<@${interaction.user.id}>`,
        inline: true,
      },
      { name: "Grund", value: reason, inline: false },
    );
}

export function banEmbed(
  member: GuildMember,
  interaction: CommandInteraction,
  reason: string,
) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("Ban")
    .setThumbnail(member.user.avatarURL())
    .addFields(
      { name: "User", value: `<@${member.id}>`, inline: true },
      { name: "Von", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Grund", value: reason, inline: false },
    );
}

export function privateBanEmbed(reason: string) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("Du wurdest gebannt")
    .addFields({ name: "Grund", value: reason, inline: false });
}

export function kickEmbed(
  member: GuildMember,
  interaction: CommandInteraction,
  reason: string,
) {
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("Kick")
    .setThumbnail(member.user.avatarURL())
    .addFields(
      { name: "User", value: `<@${member.id}>`, inline: true },
      { name: "Von", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Grund", value: reason, inline: false },
    );
}

export function privateKickEmbed(reason: string) {
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("Du wurdest gekickt")
    .addFields({ name: "Grund", value: reason, inline: false });
}
