import { EmbedBuilder } from "discord.js";

export function TicketEmbed() {
  return new EmbedBuilder()
    .setTitle("Ticket")
    .setDescription("Buttons below to claim or close the ticket.")
    .setColor("Green");
}

export function ConfirmCloseEmbed(title: string, description: string) {
  return new EmbedBuilder().setTitle(title).setDescription(description);
}
