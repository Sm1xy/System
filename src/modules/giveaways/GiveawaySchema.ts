import { Document } from "mongodb";

export interface GiveawaySchema extends Document {
  id: string;
  guildId: string;
  channelId: string;
  prize: string;
  duration: number;
  theme: string;
  participants: string[];
  endTime: number;
  messageId: string;
  creatorId: string;
  color?: string; // Add color field
  thumbnailURL?: string; // Add thumbnailURL field
}
