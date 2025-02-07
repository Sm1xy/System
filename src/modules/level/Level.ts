import { Document } from "mongodb";
import { CollectionHolderWrapper } from "../../core/database/CollectionHolderWrapper";

export interface LevelSchema extends Document {
  userId: string;
  username: string;
  displayName: string;
  creationDate: Date;
  joinDate: Date;
  level: number;
  xp: number;
  avatarURL: string;
  bannerURL?: string;
}

export class LevelCollection extends CollectionHolderWrapper<LevelSchema> {
  constructor() {
    super("Users");
  }

  async getUser(userId: string): Promise<LevelSchema | null> {
    const collection = await this.getCollection();
    return collection.findOne({ userId });
  }

  async createUser(levelData: LevelSchema): Promise<void> {
    const collection = await this.getCollection();
    await collection.insertOne(levelData);
  }

  async updateUser(
    userId: string,
    update: Partial<LevelSchema>,
  ): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne({ userId }, { $set: update });
  }

  async getTopUsers(limit: number): Promise<LevelSchema[]> {
    const collection = await this.getCollection();
    return collection
      .find({})
      .sort({ level: -1, xp: -1 })
      .limit(limit)
      .toArray();
  }

  getRequiredXP(level: number): number {
    return level * 100;
  }

  async getUserPlacement(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return -1;

    const collection = await this.getCollection();
    const placement =
      (await collection.countDocuments({
        $or: [
          { level: { $gt: user.level } },
          { level: user.level, xp: { $gt: user.xp } },
        ],
      })) + 1;

    return placement;
  }
}
