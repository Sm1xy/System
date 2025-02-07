import { Schema, model, Document } from "mongoose";

export interface IVoiceChannel extends Document {
  channelId: string;
  guildId: string;
}

const VoiceSchema = new Schema<IVoiceChannel>({
  channelId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
});

export default model<IVoiceChannel>("VoiceChannel", VoiceSchema);
