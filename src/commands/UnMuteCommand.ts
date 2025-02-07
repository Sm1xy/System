import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../core/command/Command";
import { handlePunish } from "../modules/moderation/ModerationHandler";
import { PunishType } from "../modules/moderation/ModerationType";

export class UnMuteCommand implements Command {
  name = "unmute";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Entmutet einen User")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("User").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Grund für den Entmute")
        .setRequired(true),
    );

  async execute(interaction: CommandInteraction): Promise<void> {
    handlePunish(PunishType.UNMUTE, interaction);
  }
}
