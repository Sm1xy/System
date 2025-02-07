import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../core/command/Command";
import { handlePunish } from "../modules/moderation/ModerationHandler";
import { PunishType } from "../modules/moderation/ModerationType";

export class MuteCommand implements Command {
  name = "mute";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Mutet einen User")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("User").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("Dauer des Mutes, z.B. 10d = 10 Tage")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Grund für den Mute")
        .setRequired(true),
    );

  async execute(interaction: CommandInteraction): Promise<void> {
    handlePunish(PunishType.MUTE, interaction);
  }
}
