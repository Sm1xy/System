import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  GuildMember,
  TextChannel,
  User,
} from "discord.js";
import { PunishType } from "./ModerationType";
import { parseDuration } from "../../util/DurationHandler";
import {
  banEmbed,
  kickEmbed,
  muteEmbed,
  privateBanEmbed,
  privateKickEmbed,
  privateMuteEmbed,
  privateUnmuteEmbed,
  unmuteEmbed,
} from "./ModerationEmbed";

export async function handlePunish(
  type: PunishType,
  interaction: CommandInteraction,
) {
  const options = interaction.options as CommandInteractionOptionResolver;
  const user = options.getUser("user") as User;
  if (!user) {
    await interaction.reply({
      content: "User wurde nicht gefunden.",
      ephemeral: true,
    });
    return;
  }

  const member = await interaction.guild?.members.fetch(user.id);
  if (!member) {
    await interaction.reply({
      content: "Member wurde nicht gefunden.",
      ephemeral: true,
    });
    return;
  }

  const reason = options.getString("reason");
  if (!reason) {
    await interaction.reply({
      content: "Es muss ein Grund angegeben werden!",
      ephemeral: true,
    });
    return;
  }

  switch (type) {
    case PunishType.BAN:
      ban(interaction, member, reason);
      break;
    case PunishType.MUTE:
      mute(interaction, options, member, reason);
      break;
    case PunishType.UNMUTE:
      unmute(interaction, member, reason);
      break;
    case PunishType.KICK:
      kick(interaction, member, reason);
      break;
  }
}

async function ban(
  interaction: CommandInteraction,
  member: GuildMember,
  reason: string,
) {
  await log(interaction, banEmbed(member, interaction, reason));
  await notify(member, privateBanEmbed(reason));
  await interaction.reply({
    content: `${member.displayName} wurde gebannt.`,
    ephemeral: true,
  });
  await member.ban({ reason });
}

async function mute(
  interaction: CommandInteraction,
  options: CommandInteractionOptionResolver,
  member: GuildMember,
  reason: string,
) {
  const duration = parseDuration(options.getString("time")!);
  if (duration === null) {
    await interaction.reply({
      content:
        "Ungültiges Zeitformat. Bitte verwende `d` für Tage, `h` für Stunden, `m` für Minuten und `s` für Sekunden!",
      ephemeral: true,
    });
    return;
  }

  await member.timeout(duration, reason);
  await log(interaction, muteEmbed(member, interaction, duration, reason));
  await notify(member, privateMuteEmbed(duration, reason));
  await interaction.reply({
    content: `${member.displayName} wurde gemutet.`,
    ephemeral: true,
  });
}

async function unmute(
  interaction: CommandInteraction,
  member: GuildMember,
  reason: string,
) {
  await member.timeout(null, reason);
  await log(interaction, unmuteEmbed(member, interaction, reason));
  await notify(member, privateUnmuteEmbed(reason));
  await interaction.reply({
    content: `${member.displayName} wurde entmutet.`,
    ephemeral: true,
  });
}

async function kick(
  interaction: CommandInteraction,
  member: GuildMember,
  reason: string,
) {
  await log(interaction, kickEmbed(member, interaction, reason));
  await notify(member, privateKickEmbed(reason));
  await interaction.reply({
    content: `${member.displayName} wurde gekickt.`,
    ephemeral: true,
  });
  await member.kick(reason);
}

async function log(interaction: CommandInteraction, embed: EmbedBuilder) {
  const channel = interaction.guild?.channels.cache.get(
    process.env.LOG_CHAT!,
  ) as TextChannel;

  if (!channel) {
    await interaction.reply({
      content: "Log channel wurde nicht gefunden!",
      ephemeral: true,
    });
    return;
  }

  channel.send({ embeds: [embed] });
}

async function notify(member: GuildMember, embed: EmbedBuilder) {
  try {
    await member.send({ embeds: [embed] });
  } catch {}
}
