import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
  User,
} from "discord.js";
import { Command } from "../core/command/Command";
import { LevelCollection, LevelSchema } from "../modules/level/Level";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export class TopCommand implements Command {
  name = "top";
  builder = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription("Displays the top users by level.");

  constructor() {
    const fontPath = path.resolve(process.cwd(), "./assets", "Lato-Black.ttf");
    registerFont(fontPath, { family: "Latoblack" });
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    const isEphemeral = interaction.channelId !== process.env.BOT_CHAT;
    await interaction.deferReply({ ephemeral: isEphemeral });
    const levelCollection = new LevelCollection();
    const allTopUsers: LevelSchema[] = await levelCollection.getTopUsers(100);

    const usersPerPage = 10;
    const totalPages = Math.ceil(allTopUsers.length / usersPerPage);
    let currentPage = 1;

    const generateCanvas = async (page: number) => {
      const canvas = createCanvas(700, 600); // Adjusted canvas width
      const ctx = canvas.getContext("2d");

      try {
        const bgPath = path.resolve(process.cwd(), "assets", "top-bg.png");
        const bg = await loadImage(bgPath);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error("Failed to load background image:", error);
        ctx.fillStyle = "#2C2F33";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.font = "36px Latoblack"; // bigger "Top Users" header
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("Top Users", canvas.width / 2, 80);

      const start = (page - 1) * usersPerPage;
      const end = start + usersPerPage;
      const users = allTopUsers.slice(start, end);

      let y = 138; // elevate users by 2px
      const avatarSize = 40; // smaller user avatar
      const cornerRadius = 8; // small corners for square

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const displayIndex = start + i + 1;

        try {
          const fetchedUser: User = await interaction.client.users.fetch(
            user.userId,
          );
          const avatarURL = fetchedUser.displayAvatarURL({
            extension: "png",
            size: 256,
          });

          const avatar = await loadImage(avatarURL);

          const avatarX = 10;
          const avatarY = y - 20;

          // Draw rounded square for avatar
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(avatarX + cornerRadius, avatarY);
          ctx.lineTo(avatarX + avatarSize - cornerRadius, avatarY);
          ctx.quadraticCurveTo(
            avatarX + avatarSize,
            avatarY,
            avatarX + avatarSize,
            avatarY + cornerRadius,
          );
          ctx.lineTo(avatarX + avatarSize, avatarY + avatarSize - cornerRadius);
          ctx.quadraticCurveTo(
            avatarX + avatarSize,
            avatarY + avatarSize,
            avatarX + avatarSize - cornerRadius,
            avatarY + avatarSize,
          );
          ctx.lineTo(avatarX + cornerRadius, avatarY + avatarSize);
          ctx.arc(
            avatarX + cornerRadius,
            avatarY + avatarSize - cornerRadius,
            cornerRadius,
            0.5 * Math.PI,
            Math.PI,
          );
          ctx.lineTo(avatarX, avatarY + cornerRadius);
          ctx.arc(
            avatarX + cornerRadius,
            avatarY + cornerRadius,
            cornerRadius,
            Math.PI,
            1.5 * Math.PI,
          );
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();

          ctx.font = "28px Latoblack";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.fillText(`${displayIndex}. ${user.displayName}`, 90, y + 10);

          ctx.font = "28px Latoblack";
          ctx.textAlign = "right";
          ctx.fillText(`Level: ${user.level}`, canvas.width - 40, y + 10);
        } catch (error) {
          console.error(
            `Failed to load avatar for ${user.displayName}:`,
            error,
          );
          const avatarX = 10;
          const avatarY = y - 20;

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);

          ctx.font = "28px Latoblack";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "left";
          ctx.fillText(`${displayIndex}. ${user.displayName}`, 90, y + 10);

          ctx.font = "28px Latoblack";
          ctx.textAlign = "right";
          ctx.fillText(`Level: ${user.level}`, canvas.width - 40, y + 10);
        }
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText(`${displayIndex}. ${user.displayName}`, 90, y + 10);

        ctx.font = "28px Latoblack";
        ctx.textAlign = "right";
        ctx.fillText(`Level: ${user.level}`, canvas.width - 40, y + 10);

        // Draw line under user
        ctx.strokeStyle = "#2A2A2A";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, y + 30);
        ctx.lineTo(canvas.width - 10, y + 30);
        ctx.stroke();

        y += 43; // smaller row + 3px bottom margin
      }
      return canvas.toBuffer();
    };

    const attachment = await generateCanvas(currentPage);
    const embed = new EmbedBuilder()
      .setTitle("Leaderboard")
      .setColor("#2C2F33")
      .setImage("attachment://top.png")
      .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

    const file = {
      attachment: attachment,
      name: "top.png",
    };

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("◀️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("▶️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(totalPages <= 1),
    );

    await interaction.editReply({
      embeds: [embed],
      files: [file],
      components: [row],
    });

    const message = await interaction.fetchReply();

    const filter = (i: ButtonInteraction) => i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on("collect", async (i: ButtonInteraction) => {
      if (i.customId === "previous") {
        currentPage--;
      } else if (i.customId === "next") {
        currentPage++;
      }

      let newAttachment: Buffer;
      try {
        newAttachment = await generateCanvas(currentPage);
      } catch (error) {
        console.error("Error generating new canvas:", error);
        await i.update({
          content: "Es gab einen Fehler beim Aktualisieren des Leaderboards.",
          components: [],
        });
        collector.stop();
        return;
      }

      const newEmbed = EmbedBuilder.from(embed).setFooter({
        text: `Page ${currentPage} of ${totalPages}`,
      });

      const newFile = {
        attachment: newAttachment,
        name: "top.png",
      };

      const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("previous")
          .setLabel("◀️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage <= 1),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("▶️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= totalPages),
      );

      await i.update({
        embeds: [newEmbed],
        files: [newFile],
        components: [newRow],
      });
    });
  }
}
