import {
  SlashCommandBuilder,
  CommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../core/command/Command";
import { GiveawayHandler } from "../modules/giveaways/GiveawayHandler";
import GiveawayEmbeds from "../modules/giveaways/GiveawayEmbeds";

export class EndGiveawayCommand implements Command {
  name = "endgiveaway";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("End a giveaway early")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("giveawayid")
        .setDescription("ID of the giveaway to end")
        .setRequired(true),
    );

  async execute(interaction: CommandInteraction): Promise<void> {
    const giveawayId = interaction.options.get("giveawayid", true)
      ?.value as string;

    if (!interaction.memberPermissions?.has("Administrator")) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
      return;
    }

    try {
      await GiveawayHandler.endGiveawayEarly(giveawayId);
      await interaction.reply({
        content: `🎉 Giveaway with ID \`${giveawayId}\` has been ended early.`,
        ephemeral: false,
      });
    } catch (error: any) {
      console.error(error);
      const errorEmbed = GiveawayEmbeds.createErrorEmbed(
        "Failed to end giveaway. Please ensure the Giveaway ID is correct.",
      );
      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }
}
