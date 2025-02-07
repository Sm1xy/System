import { EmbedBuilder } from "discord.js";

export interface TicketType {
  name: string;
  embed: EmbedBuilder;
}

export const TicketTypes: TicketType[] = [
  {
    name: "General",
    embed: new EmbedBuilder()
      .setTitle("Support Ticket")
      .setDescription("Beschreibe dein Problem und das Team hilft dir.")
      .setColor("Blurple"),
  },
  {
    name: "BugReport",
    embed: new EmbedBuilder()
      .setTitle("Bug Report")
      .setDescription("Provide bug details.")
      .setColor("Red"),
  },
  {
    name: "PIC",
    embed: new EmbedBuilder()
      .setTitle("PIC")
      .setDescription("PIC.")
      .setThumbnail(
        "https://cdn.discordapp.com/icons/1235224146921914479/5609a435f6055cebc613af550a6efe39.webp?size=1024&format=webp",
      )
      .setColor("Red"),
  },
];
