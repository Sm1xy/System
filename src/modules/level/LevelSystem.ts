import {
  Client,
  Message,
  VoiceState,
  Interaction,
  GuildMember,
  TextChannel,
  ChannelType,
} from "discord.js";
import { LevelCollection, LevelSchema } from "./Level";
import { LevelCache } from "./LevelCache";
import Logger from "../../util/logger";
import dotenv from "dotenv";

dotenv.config();

export class LevelSystem {
  private levelCollection: LevelCollection;
  private cache: LevelCache;
  private logger: Logger;
  private botChatChannelId: string | undefined;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.levelCollection = new LevelCollection();
    this.cache = new LevelCache();
    this.logger = new Logger(client);
    this.botChatChannelId = process.env.BOT_CHAT;
    this.initialize(client);
  }

  private async initialize(client: Client) {
    await this.loadCache();

    client.on("messageCreate", (message: Message) =>
      this.handleMessage(message),
    );
    client.on(
      "voiceStateUpdate",
      (oldState: VoiceState, newState: VoiceState) =>
        this.handleVoiceStateUpdate(oldState, newState),
    );
    client.on("interactionCreate", (interaction: Interaction) =>
      this.handleInteraction(interaction),
    );

    process.on("SIGINT", () => {
      this.cache.clear();
      this.logger.info("Level cache cleared on shutdown.", true);
      process.exit();
    });
  }

  private async loadCache(): Promise<void> {
    const collection = await this.levelCollection.getCollection();
    const users = await collection.find({}).toArray();
    users.forEach((user) => this.cache.set(user.userId, user));
    this.logger.info("Level cache loaded.", true);
  }

  private async handleMessage(message: Message): Promise<void> {
    if (message.author.bot || !message.guild) return;
    const member = message.guild?.members.cache.get(message.author.id);
    if (member) {
      await this.awardXP(member, "message", message);
    }
  }

  private async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState,
  ): Promise<void> {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (newChannel && this.isActiveInVoice(newChannel, member)) {
      await this.awardXP(member, "voice");
    }
  }

  private isActiveInVoice(channel: any, member: GuildMember): boolean {
    const members = channel.members.filter(
      (m: GuildMember) => !m.user.bot && m.id !== member.id,
    );
    return members.size > 0;
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) return;
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (member) {
      await this.awardXP(member, "command");
    }
  }

  private async awardXP(
    user: GuildMember,
    source: string,
    message?: Message,
  ): Promise<void> {
    const userId = user.id;
    let userData: LevelSchema | undefined = this.cache.get(userId);

    if (!userData) {
      userData = (await this.levelCollection.getUser(userId)) || undefined;
      if (!userData) {
        userData = {
          userId,
          username: user.user.username,
          displayName: user.displayName,
          creationDate: user.user.createdAt,
          joinDate: new Date(),
          level: 1,
          xp: 0,
          avatarURL: user.user.displayAvatarURL() || "",
          bannerURL: user.user.bannerURL() || "",
        };
        await this.levelCollection.createUser(userData);
        this.cache.set(userId, userData);
      }
    }

    if (userData.level >= 100) return;

    let xpToAdd = 0;
    switch (source) {
      case "message":
        if (message && message.content) {
          xpToAdd = Math.floor(message.content.length / 3);
        }
        break;
      case "voice":
        xpToAdd = 3;
        break;
      case "command":
        xpToAdd = 5;
        break;
      default:
        xpToAdd = 1;
    }

    userData.xp += xpToAdd;
    const requiredXP = this.getRequiredXP(userData.level);
    let leveledUp = false;
    let isRewardLevel = false;

    if (userData.xp >= requiredXP && userData.level < 100) {
      userData.level += 1;
      userData.xp -= requiredXP;
      leveledUp = true;

      if (userData.level % 20 === 0) {
        isRewardLevel = true;
        const roleId = process.env[`LEVEL_${userData.level}_ROLE`] as string;
        if (roleId) {
          const role = user.guild.roles.cache.get(roleId);
          if (role) {
            user.roles
              .add(role)
              .then(() => {
                this.logger.info(
                  `Assigned role ${role.name} to ${user.displayName}.`,
                  true,
                );
              })
              .catch((err) => {
                this.logger.warn(
                  `Failed to assign role ${role.name} to ${user.displayName}: ${err}`,
                  true,
                );
              });

            await this.sendToBotChat(
              `🎉 **${user.displayName}** hat die **${role.name}** Rolle erhalten weil er level ${userData.level} erreicht hat!`,
            );
          } else {
            this.logger.warn(
              `Role with ID ${roleId} not found in guild.`,
              true,
            );
          }
        } else {
          this.logger.warn(
            `Environment variable LEVEL_${userData.level}_ROLE is not set.`,
            true,
          );
        }
      }
    }

    await this.levelCollection.updateUser(userId, {
      xp: userData.xp,
      level: userData.level,
      username: user.user.username,
      displayName: user.displayName,
      avatarURL: user.user.displayAvatarURL() || "",
      bannerURL: user.user.bannerURL() || "",
    });
    this.cache.set(userId, userData);

    if (leveledUp && !isRewardLevel) {
      await this.sendToBotChat(
        ` Glückwunsch **${user.displayName}**, du hast Level **${userData.level}** erreicht!`,
      );
    }
  }

  private getRequiredXP(level: number): number {
    return level * 50;
  }

  private async sendToBotChat(message: string): Promise<void> {
    if (!this.botChatChannelId) {
      this.logger.warn(
        "BOT_CHAT channel ID is not defined in environment variables.",
        true,
      );
      return;
    }

    try {
      const channel = await this.client.channels.fetch(this.botChatChannelId);

      if (!channel) {
        this.logger.warn(
          `BOT_CHAT channel with ID ${this.botChatChannelId} not found.`,
          true,
        );
        return;
      }

      if (channel.type !== ChannelType.GuildText) {
        this.logger.warn(
          `BOT_CHAT channel with ID ${this.botChatChannelId} is not a text channel.`,
          true,
        );
        return;
      }

      await (channel as TextChannel).send(message);
      this.logger.info("Sent message to BOT_CHAT channel.", true);
    } catch (error) {
      this.logger.warn(
        `Failed to send message to BOT_CHAT channel: ${error}`,
        true,
      );
    }
  }
}
