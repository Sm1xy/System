// src/events/WelcomeMSG.ts
import {
  Events,
  Client,
  GuildMember,
  GuildTextBasedChannel,
  AttachmentBuilder,
  EmbedBuilder,
} from "discord.js";
import { UserEvent } from "../core/event/UserEvent";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import Logger from "../util/logger";

// Register the custom font
registerFont(path.join(__dirname, "../../assets", "Lato-Black.ttf"), {
  family: "Latoblack",
});

export default class WelcomeMSG extends UserEvent<[GuildMember]> {
  constructor() {
    super(Events.GuildMemberAdd);
  }
  public async execute(client: Client, member: GuildMember): Promise<void> {
    // Initialize the logger with the client
    const logger = new Logger(client);

    const wlcChannelId = process.env.WELCOME_CHAT;
    if (!wlcChannelId) {
      logger.error("WELCOME_CHAT environment variable is not set.");
      return;
    }

    const wlcChannel = member.guild.channels.cache.get(
      wlcChannelId,
    ) as GuildTextBasedChannel;

    if (!wlcChannel || !wlcChannel.isTextBased()) {
      logger.error(
        `Welcome channel with ID ${wlcChannelId} not found or is not text-based.`,
      );
      return;
    }

    const memberCount = member.guild.memberCount;

    let welcomeBannerBuffer: Buffer;
    try {
      welcomeBannerBuffer = await this.createWelcomeBanner(
        member.displayAvatarURL({ size: 256, extension: "jpg" }),
        member.displayName,
        memberCount,
      );
    } catch (error: any) {
      logger.error("Error creating welcome banner: " + error.message);
      return;
    }

    const welcomeEmbed = new EmbedBuilder()
      .setColor("#5A09C1")
      .setTitle(`Wilkommen zur 42er Unity, ${member.displayName}!`)
      .setDescription(`Wilkommen zum 42er Unity Discord Server 🎉\n`)
      .setImage("attachment://welcome-image.png")
      .setFooter({
        text: "42er Unity",
        iconURL: member.guild.iconURL() || undefined,
      });

    const attachment = new AttachmentBuilder(welcomeBannerBuffer, {
      name: "welcome-image.png",
    });

    try {
      await wlcChannel.send({
        embeds: [welcomeEmbed],
        files: [attachment],
      });
      logger.info(`Sent welcome message to ${member.user.tag}.`);
    } catch (error: any) {
      logger.error(
        `Failed to send welcome message to ${member.user.tag}: ${error.message}`,
      );
    }
  }

  private async createWelcomeBanner(
    avatarURL: string,
    username: string,
    memberCount: number | string,
  ): Promise<Buffer> {
    const canvas = createCanvas(800, 360);
    const ctx = canvas.getContext("2d");

    // Load and draw background image
    try {
      const background = await loadImage(
        path.join(__dirname, "../../assets", "welcome-bg.png"),
      );
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch (error: any) {
      console.error("Error loading background image: " + error.message);
      ctx.fillStyle = "#36393f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Overlay settings
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Welcome text
    ctx.font = "40px Latoblack";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`Wilkommen zur 42er Unity,`, canvas.width / 2, 230);

    ctx.font = "55px Latoblack";
    ctx.fillText(username, canvas.width / 2, 310);

    ctx.font = "20px Latoblack";
    ctx.textAlign = "left";
    ctx.fillText(`Member #${memberCount}`, 20, canvas.height - 14);

    // Member avatar
    try {
      const avatar = await loadImage(avatarURL);

      const avatarSize = 160;
      const avatarX = canvas.width / 2 - avatarSize / 2;
      const avatarY = 20;
      const radius = 20;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(avatarX + radius, avatarY);
      ctx.lineTo(avatarX + avatarSize - radius, avatarY);
      ctx.quadraticCurveTo(
        avatarX + avatarSize,
        avatarY,
        avatarX + avatarSize,
        avatarY + radius,
      );
      ctx.lineTo(avatarX + avatarSize, avatarY + avatarSize - radius);
      ctx.quadraticCurveTo(
        avatarX + avatarSize,
        avatarY + avatarSize,
        avatarX + avatarSize - radius,
        avatarY + avatarSize,
      );
      ctx.lineTo(avatarX + radius, avatarY + avatarSize);
      ctx.quadraticCurveTo(
        avatarX,
        avatarY + avatarSize,
        avatarX,
        avatarY + avatarSize - radius,
      );
      ctx.lineTo(avatarX, avatarY + radius);
      ctx.quadraticCurveTo(avatarX, avatarY, avatarX + radius, avatarY);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } catch (error: any) {
      console.error("Error loading profile picture: " + error.message);
      ctx.fillStyle = "#7289da";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 100, 80, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
    }

    return canvas.toBuffer();
  }
}
