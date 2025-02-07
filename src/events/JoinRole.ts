import { Client, GuildMember } from "discord.js";
import { Event } from "../core/event/Event";
import { LevelCollection, LevelSchema } from "../modules/level/Level";
import dotenv from "dotenv";

dotenv.config();

export default class JoinRole extends Event {
  private levelCollection: LevelCollection = new LevelCollection();

  constructor() {
    super("guildMemberAdd");
  }

  public async execute(
    client: Client<boolean>,
    member: GuildMember,
  ): Promise<void> {
    const role = member.guild.roles.cache.find(
      (r) => r.name === process.env.JOIN_ROLE,
    );
    if (role) {
      await member.roles.add(role);
    }

    const existingUser = await this.levelCollection.getUser(member.id);
    if (!existingUser) {
      const newUser: LevelSchema = {
        userId: member.id,
        username: member.user.username,
        displayName: member.displayName,
        creationDate: member.user.createdAt,
        joinDate: member.joinedAt || new Date(),
        level: 1,
        xp: 0,
        avatarURL: member.user.avatarURL() || "",
        bannerURL: member.user.bannerURL() || "",
      };
      await this.levelCollection.createUser(newUser);
    }
  }

  public listen(client: Client): void {
    client.on(this.name, async (member: GuildMember) => {
      await this.execute(client, member);
    });
  }
}
