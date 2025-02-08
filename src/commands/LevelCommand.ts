import {
  SlashCommandBuilder,
  CommandInteraction,
  User,
  CommandInteractionOptionResolver,
  GuildMember,
} from "discord.js";
import { Command } from "../core/command/Command";
import { LevelCollection } from "../modules/level/Level";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import dotenv from "dotenv";
import Vibrant from "node-vibrant";

dotenv.config();

export class LevelCommand implements Command {
  name = "level";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Displays your or another user's level and XP.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to look up")
        .setRequired(false),
    );

  constructor() {
    const fontPath = path.resolve(process.cwd(), "./assets", "Lato-Black.ttf");
    registerFont(fontPath, { family: "Latoblack" });
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    const target: User =
      (interaction.options as CommandInteractionOptionResolver).getUser(
        "user",
      ) || interaction.user;

    let displayName = target.username;
    if (interaction.guild) {
      try {
        const member = await interaction.guild.members.fetch(target.id);
        if (member instanceof GuildMember && member.displayName) {
          displayName = member.displayName;
        }
      } catch {}
    }

    const levelCollection = new LevelCollection();
    const userData = await levelCollection.getUser(target.id);

    if (!userData) {
      const isEphemeral = interaction.channelId !== process.env.BOT_CHAT;
      await interaction.reply({
        content: "User not found in the database.",
        ephemeral: isEphemeral,
      });
      return;
    }

    const placement = await levelCollection.getUserPlacement(target.id);

    const canvas = createCanvas(700, 200);
    const ctx = canvas.getContext("2d");

    try {
      const bgPath = path.join(__dirname, "../../assets/level-bg.png");
      const bg = await loadImage(bgPath);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error("Failed to load background image:", error);
      ctx.fillStyle = "#2C2F33";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    let mainColor = "#ffffff";
    try {
      const avatarURL = target.displayAvatarURL({
        extension: "png",
        size: 256,
      });
      const avatar = await loadImage(avatarURL);

      const avatarSize = 150;
      const avatarX = 30;
      const avatarY = 25;
      const radius = avatarSize / 2;

      const palette = await Vibrant.from(avatarURL).getPalette();

      if (palette?.Vibrant) {
        mainColor = palette.Vibrant.getHex();
      } else if (palette?.Muted) {
        mainColor = palette.Muted.getHex();
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + radius, avatarY + radius, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } catch (error) {
      console.error("Failed to load avatar image:", error);
      const avatarSize = 150;
      const avatarX = 30;
      const avatarY = 25;

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2,
        true,
      );
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    }

    ctx.fillStyle = mainColor;
    ctx.font = "36px Latoblack";
    ctx.fillText(displayName, 220, 60);

    ctx.fillStyle = "#ffffff";
    ctx.font = "48px Latoblack";
    ctx.textAlign = "right";
    ctx.fillText(`#${placement}`, canvas.width - 30, canvas.height / 2);
    ctx.textAlign = "left";

    ctx.fillStyle = "#ffffff";
    ctx.font = "32px Latoblack";
    ctx.fillText(`Level: ${userData.level}`, 220, 100);

    ctx.font = "24px Latoblack";
    ctx.fillText(
      `XP: ${userData.xp} / ${levelCollection.getRequiredXP(userData.level)}`,
      220,
      130,
    );

    const progress = Math.min(
      userData.xp / levelCollection.getRequiredXP(userData.level),
      1,
    );
    const barWidth = 320;
    const barHeight = 25;
    const barX = 220;
    const barY = 150;
    const barRadius = 12;
    const filledWidth = barWidth * progress;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(barX + barRadius, barY);
    ctx.lineTo(barX + barWidth - barRadius, barY);
    ctx.arc(
      barX + barWidth - barRadius,
      barY + barRadius,
      barRadius,
      1.5 * Math.PI,
      0,
    );
    ctx.lineTo(barX + barWidth, barY + barHeight - barRadius);
    ctx.arc(
      barX + barWidth - barRadius,
      barY + barHeight - barRadius,
      barRadius,
      0,
      0.5 * Math.PI,
    );
    ctx.lineTo(barX + barRadius, barY + barHeight);
    ctx.arc(
      barX + barRadius,
      barY + barHeight - barRadius,
      barRadius,
      0.5 * Math.PI,
      Math.PI,
    );
    ctx.lineTo(barX, barY + barRadius);
    ctx.arc(
      barX + barRadius,
      barY + barRadius,
      barRadius,
      Math.PI,
      1.5 * Math.PI,
    );
    ctx.closePath();

    ctx.fillStyle = "#292929";
    ctx.fill();

    if (filledWidth > 0) {
      ctx.beginPath();
      ctx.moveTo(barX + barRadius, barY);
      const filledX = barX + filledWidth;
      ctx.lineTo(filledX - barRadius, barY);
      ctx.arc(
        filledX - barRadius,
        barY + barRadius,
        barRadius,
        1.5 * Math.PI,
        0,
      );
      ctx.lineTo(filledX, barY + barHeight - barRadius);
      ctx.arc(
        filledX - barRadius,
        barY + barHeight - barRadius,
        barRadius,
        0,
        0.5 * Math.PI,
      );
      ctx.lineTo(barX + barRadius, barY + barHeight);
      ctx.arc(
        barX + barRadius,
        barY + barHeight - barRadius,
        barRadius,
        0.5 * Math.PI,
        Math.PI,
      );
      ctx.lineTo(barX, barY + barRadius);
      ctx.arc(
        barX + barRadius,
        barY + barRadius,
        barRadius,
        Math.PI,
        1.5 * Math.PI,
      );
      ctx.closePath();

      ctx.fillStyle = mainColor;
      ctx.fill();
    }
    ctx.restore();

    const isEphemeral = interaction.channelId !== process.env.BOT_CHAT;
    await interaction.reply({
      files: [
        {
          attachment: canvas.toBuffer(),
          name: "level.png",
        },
      ],
      ephemeral: isEphemeral,
    });
  }
}
