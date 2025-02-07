import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../core/command/Command";
import { handlePunish } from "../modules/moderation/ModerationHandler";
import { PunishType } from "../modules/moderation/ModerationType";

export class BanCommand implements Command {
  name = "ban";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Bannt einen User")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("User").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Grund für den Ban")
        .setRequired(true),
    );

  async execute(interaction: CommandInteraction): Promise<void> {
    await handlePunish(PunishType.BAN, interaction);
  }
}
