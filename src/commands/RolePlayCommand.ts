import {
  SlashCommandBuilder,
  CommandInteraction,
  CommandInteractionOptionResolver,
  PermissionFlagsBits,
} from "discord.js";
import { RolePlayEmotions } from "../modules/roleplay/RolePlayEmotions";
import { Command } from "../core/command/Command";
import { RolePlaySystem } from "../modules/roleplay/RolePlaySystem";

export class RPCommand implements Command {
  name = "rp";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Send a roleplay gif to a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .addStringOption((option) =>
      option
        .setName("emotion")
        .setDescription("The emotion to express")
        .setRequired(true)
        .addChoices(
          ...Object.keys(RolePlayEmotions).map((emotion) => ({
            name: emotion,
            value: emotion,
          })),
        ),
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to send the gif to")
        .setRequired(true),
    );
  async execute(interaction: CommandInteraction) {
    const emotion = (
      interaction.options as CommandInteractionOptionResolver
    ).getString("emotion", true);
    const user = (
      interaction.options as CommandInteractionOptionResolver
    ).getUser("user", true);

    const rolePlaySystem = new RolePlaySystem();
    await rolePlaySystem.sendRolePlayGif(interaction, emotion, user);
  }
}
