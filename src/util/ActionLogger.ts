import {
  AuditLogEvent,
  EmbedBuilder,
  GuildAuditLogsEntry,
  TextChannel,
  ChannelType,
} from "discord.js";
import Logger from "./logger";
import client from "../bot";
import dotenv from "dotenv";
dotenv.config();

const logger = new Logger(client);
const logChannelId = process.env.LOG_CHAT!;
let lastAuditLogId: string | null = null;

class ActionLogger {
  static async logAuditEntry(entry: GuildAuditLogsEntry) {
    const { action, executor, target, reason, changes, createdAt } = entry;

    let title = "Audit Log Entry";
    let color = 0x00ff00;
    let targetMention = "Unknown";

    if (target) {
      if ("type" in target) {
        switch (target.type) {
          case "USER":
            targetMention = `<@!${target.id}>`;
            break;
          case "CHANNEL":
            targetMention = `<#${target.id}>`;
            break;
          case "ROLE":
            targetMention = `<@&${target.id}>`;
            break;
          default:
            targetMention = target.toString();
            break;
        }
      } else {
        targetMention = target.toString();
      }
    }

    const fields = [
      { name: "Action", value: action.toString(), inline: true },
      {
        name: "Executor",
        value: executor ? `<@!${executor.id}>` : "Unknown",
        inline: true,
      },
      { name: "Target", value: targetMention, inline: true },
      { name: "Reason", value: reason || "No reason provided", inline: false },
      { name: "Time", value: createdAt.toLocaleTimeString(), inline: false },
      { name: "Date", value: createdAt.toLocaleDateString(), inline: false },
    ];

    if (changes && changes.length > 0) {
      changes.forEach((change) => {
        fields.push({
          name: change.key.charAt(0).toUpperCase() + change.key.slice(1),
          value: `**Before:** ${ActionLogger.formatChangeValue(change.old)}\n**After:** ${ActionLogger.formatChangeValue(change.new)}`,
          inline: false,
        });
      });
    }

    switch (action) {
      case AuditLogEvent.MemberUpdate:
        title = "Member Updated";
        color = 0xffff00;
        break;
      case AuditLogEvent.MemberRoleUpdate:
        title = "Member Role Updated";
        color = 0xffff00;
        break;
      case AuditLogEvent.MemberBanAdd:
        title = "Member Banned";
        color = 0xff0000;
        break;
      case AuditLogEvent.MemberBanRemove:
        title = "Member Unbanned";
        color = 0x00ff00;
        break;
      case AuditLogEvent.GuildUpdate:
        title = "Guild Updated";
        color = 0xffff00;
        break;
      case AuditLogEvent.ChannelCreate:
        title = "Channel Created";
        color = 0x00ff00;
        break;
      case AuditLogEvent.ChannelDelete:
        title = "Channel Deleted";
        color = 0xff0000;
        break;
      case AuditLogEvent.ChannelUpdate:
        title = "Channel Updated";
        color = 0xffff00;
        break;
      case AuditLogEvent.RoleCreate:
        title = "Role Created";
        color = 0x00ff00;
        break;
      case AuditLogEvent.RoleDelete:
        title = "Role Deleted";
        color = 0xff0000;
        break;
      case AuditLogEvent.RoleUpdate:
        title = "Role Updated";
        color = 0xffff00;
        break;
      case AuditLogEvent.EmojiCreate:
        title = "Emoji Created";
        color = 0x00ff00;
        break;
      case AuditLogEvent.EmojiDelete:
        title = "Emoji Deleted";
        color = 0xff0000;
        break;
      case AuditLogEvent.EmojiUpdate:
        title = "Emoji Updated";
        color = 0xffff00;
        break;
      default:
        title = "Audit Log Entry";
        color = 0x00ff00;
        break;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .addFields(fields)
      .setColor(color)
      .setThumbnail(executor?.avatarURL() || "")
      .setTimestamp();

    const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  }

  static formatChangeValue(value: any): string {
    if (typeof value === "object" && value !== null) {
      if (value.id) {
        switch (value.type) {
          case ChannelType.GuildText:
          case ChannelType.GuildVoice:
          case ChannelType.GuildCategory:
            return `<#${value.id}>`;
          case "ROLE":
            return `<@&${value.id}>`;
          case "USER":
            return `<@!${value.id}>`;
          default:
            return value.toString();
        }
      }
      return JSON.stringify(value);
    }
    return value !== null ? value.toString() : "None";
  }
}

setInterval(async () => {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;
    const auditLogs = await guild.fetchAuditLogs({ limit: 10 });
    const entries = auditLogs.entries
      .filter((entry) => {
        if (!lastAuditLogId) return true;
        return entry.id > lastAuditLogId;
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    for (const entry of entries.values()) {
      await ActionLogger.logAuditEntry(entry);
      if (!lastAuditLogId || entry.id > lastAuditLogId) {
        lastAuditLogId = entry.id;
      }
    }
  } catch (error) {
    logger.error("Error fetching audit logs", error);
  }
}, 1000);

client.once("ready", async () => {
  const guild = client.guilds.cache.first();
  if (guild) {
    const auditLogs = await guild.fetchAuditLogs({ limit: 1 });
    const latestEntry = auditLogs.entries.first();
    if (latestEntry) {
      lastAuditLogId = latestEntry.id;
    }
  }
});

export default ActionLogger;
