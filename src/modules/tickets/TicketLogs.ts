import { TextChannel, Message } from "discord.js";

class TicketLog {
  private static cache: Map<
    string,
    { type: string; channelName: string; messages: string[] }
  > = new Map();

  static initTicketLog(
    ticketChannelId: string,
    ticketType: string,
    channelName: string,
  ) {
    this.cache.set(ticketChannelId, {
      type: ticketType,
      channelName,
      messages: [],
    });
  }

  static addMessage(
    ticketChannelId: string,
    authorTag: string,
    message: Message,
  ) {
    const ticketData = this.cache.get(ticketChannelId);
    if (!ticketData) return;

    let content = message.content;

    // Include stickers
    if (message.stickers.size > 0) {
      message.stickers.forEach((sticker) => {
        content += `\nSticker: ${sticker.name}`;
      });
    }

    // Include attachments
    if (message.attachments.size > 0) {
      content += `\nAttachments:`;
      message.attachments.forEach((attachment) => {
        content += `\n${attachment.url}`;
      });
    }

    ticketData.messages.push(`[${authorTag}]: ${content}`);
  }

  static async sendLogAndClear(
    ticketChannelId: string,
    logChannel: TextChannel,
  ) {
    const ticketData = this.cache.get(ticketChannelId);
    if (!ticketData) return;

    const finalLog =
      `**Ticket Type**: ${ticketData.type}\n` +
      `**Ticket Name**: ${ticketData.channelName}\n` +
      "```" +
      ticketData.messages.join("\n") +
      "```";

    await logChannel.send(finalLog);
    this.cache.delete(ticketChannelId);
  }
}

export default TicketLog;
