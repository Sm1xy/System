import axios from "axios";
import {
  CommandInteraction,
  EmbedBuilder,
  User,
  TextChannel,
} from "discord.js";
import { RolePlayEmotions, RolePlayEmotion } from "./RolePlayEmotions";

export class RolePlaySystem {
  private apiUrl = "https://api.otakugifs.xyz/gif";

  public async sendRolePlayGif(
    interaction: CommandInteraction,
    emotion: string,
    user: User,
  ): Promise<void> {
    if (interaction.user.id === user.id) {
      await interaction.reply({
        content: `You can't ${emotion} yourself! Are you good?`,
        ephemeral: true,
      });
      return;
    }

    const gifUrl = await this.fetchGif(emotion);
    if (!gifUrl) {
      await interaction.reply({
        content: "Failed to fetch a gif.",
        ephemeral: true,
      });
      return;
    }

    const embed = this.createEmbed(interaction.user, user, emotion, gifUrl);

    await interaction.reply({ content: `${user}` });
    await interaction.deleteReply();
    if (interaction.channel?.isTextBased()) {
      await (interaction.channel as TextChannel).send({ embeds: [embed] });
    }
  }

  private async fetchGif(emotion: string): Promise<string | null> {
    try {
      const response = await axios.get("https://api.otakugifs.xyz/gif", {
        params: {
          reaction: emotion,
          format: "gif",
        },
      });
      return response.data.url;
    } catch (error) {
      console.error("Failed to fetch gif:", error);
      return null;
    }
  }

  private createEmbed(
    sender: User,
    receiver: User,
    emotion: string,
    gifUrl: string,
  ): EmbedBuilder {
    const emotionData: RolePlayEmotion = RolePlayEmotions[emotion];
    const description = `${sender} ${emotionData.secondaryAction} ${receiver}`;
    const color = emotionData.color;
    const title = `${sender.displayName} ${emotionData.action} ${receiver.displayName}!`;

    return new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setImage(gifUrl)
      .setFooter({
        text: `Angefordert von ${sender.displayName}`,
        iconURL: sender.displayAvatarURL(),
      });
  }
}
