import { Collection } from "mongodb";
import { CollectionHolderWrapper } from "../../core/database/CollectionHolderWrapper";
import VoiceSchema, { IVoiceChannel } from "./VoiceSchema";

/**
 * VoiceCollection handles all database operations related to voice channels.
 */
export class VoiceCollection extends CollectionHolderWrapper<IVoiceChannel> {
  constructor() {
    super("VoiceChannels");
  }

  /**
   * Retrieves a voice channel document by its guild ID and channel ID.
   * @param guildId The ID of the guild.
   * @param channelId The ID of the voice channel.
   * @returns The voice channel document or null if not found.
   */
  async getVoiceChannel(
    guildId: string,
    channelId: string,
  ): Promise<IVoiceChannel | null> {
    const collection: Collection<IVoiceChannel> = await this.getCollection();
    return collection.findOne({ guildId, channelId });
  }

  /**
   * Creates a new voice channel document in the database.
   * @param voiceData The data of the voice channel to create.
   */
  async createVoiceChannel(voiceData: IVoiceChannel): Promise<void> {
    const collection: Collection<IVoiceChannel> = await this.getCollection();
    await collection.insertOne(voiceData);
  }

  /**
   * Updates an existing voice channel document.
   * @param guildId The ID of the guild.
   * @param channelId The ID of the voice channel to update.
   * @param update The partial data to update the voice channel with.
   */
  async updateVoiceChannel(
    guildId: string,
    channelId: string,
    update: Partial<IVoiceChannel>,
  ): Promise<void> {
    const collection: Collection<IVoiceChannel> = await this.getCollection();
    await collection.updateOne({ guildId, channelId }, { $set: update });
  }

  /**
   * Deletes a voice channel document from the database.
   * @param guildId The ID of the guild.
   * @param channelId The ID of the voice channel to delete.
   */
  async deleteVoiceChannel(guildId: string, channelId: string): Promise<void> {
    const collection: Collection<IVoiceChannel> = await this.getCollection();
    await collection.deleteOne({ guildId, channelId });
  }

  /**
   * Retrieves all monitored voice channels for a specific guild from the database.
   * @param guildId The ID of the guild.
   * @returns An array of all monitored voice channel documents for the guild.
   */
  async getAllVoiceChannels(guildId: string): Promise<IVoiceChannel[]> {
    const collection: Collection<IVoiceChannel> = await this.getCollection();
    return collection.find({ guildId }).toArray();
  }
}

export default VoiceCollection;
