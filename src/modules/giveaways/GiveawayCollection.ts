import { CollectionHolderWrapper } from "../../core/database/CollectionHolderWrapper";
import { GiveawaySchema } from "./GiveawaySchema";

export class GiveawayCollection extends CollectionHolderWrapper<GiveawaySchema> {
  constructor() {
    super("Giveaways");
  }

  async getGiveaway(giveawayId: string): Promise<GiveawaySchema | null> {
    const collection = await this.getCollection();
    return collection.findOne({ id: giveawayId });
  }

  async createGiveaway(giveawayData: GiveawaySchema): Promise<void> {
    const collection = await this.getCollection();
    await collection.insertOne(giveawayData);
  }

  async updateGiveaway(
    giveawayId: string,
    update: Partial<GiveawaySchema>,
  ): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne({ id: giveawayId }, { $set: update });
  }

  async deleteGiveaway(giveawayId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteOne({ id: giveawayId });
  }
}
