import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  TextChannel,
  GuildMember,
  CategoryChannel,
  PermissionFlagsBits,
  OverwriteResolvable,
  Client,
  Interaction,
} from "discord.js";
import { TicketEmbed, ConfirmCloseEmbed } from "./TicketEmbeds";
import { TicketTypes } from "./TicketTypes";
import TicketLog from "./TicketLogs";

export const TicketSystem = {
  init(client: Client) {
    client.on("interactionCreate", async (interaction: Interaction) => {
      if (!interaction.isButton()) return;
      if (interaction.customId === "open_ticket") {
        await this.createTicket(interaction, "General");
      } else {
        this.handleTicketButtons(interaction);
      }
    });
  },

  async handleSetup(interaction: ChatInputCommandInteraction, type: string) {
    await interaction.reply({
      content: "Ticketsystem erfolgreich eingerichtet! ✅",
      ephemeral: true,
    });

    const ticketType =
      TicketTypes.find((t) => t.name === type) ?? TicketTypes[0];
    const openButton = new ButtonBuilder()
      .setCustomId("open_ticket")
      .setLabel("Ticket erstellen 📩")
      .setStyle(ButtonStyle.Primary);

    await (interaction.channel as TextChannel).send({
      embeds: [ticketType.embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(openButton),
      ],
    });
  },

  async createTicket(btn: ButtonInteraction, type: string = "General") {
    const user = btn.user;
    const member = btn.member as GuildMember;
    const category = (btn.channel as TextChannel).parent as CategoryChannel;
    const channelName = `ticket-${user.username.toLowerCase()}`;

    const teamRoleId = process.env.TEAM_ROLE!;
    const permissions: OverwriteResolvable[] = [
      {
        id: btn.guild!.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: teamRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    const ticketChannel = await btn.guild!.channels.create({
      name: channelName,
      type: 0,
      parent: category?.id,
      topic: `Ticket erstellt von ${user.username} (${user.id})`,
      permissionOverwrites: permissions,
    });

    TicketLog.initTicketLog(ticketChannel.id, type, channelName);

    const pingMsg = await ticketChannel.send(
      `Neues Ticket erstellt von <@${user.id}>! <@&${teamRoleId}>`,
    );
    await pingMsg.delete().catch(() => {});

    const claimButton = new ButtonBuilder()
      .setCustomId("claim_ticket")
      .setLabel("Ticket annehmen 🛠️")
      .setStyle(ButtonStyle.Success);
    const closeButton = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Ticket schließen 🗑️")
      .setStyle(ButtonStyle.Danger);

    await ticketChannel.send({
      embeds: [TicketEmbed()],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          claimButton,
          closeButton,
        ),
      ],
    });

    ticketChannel.client.on("messageCreate", (msg) => {
      if (msg.channel.id === ticketChannel.id && !msg.author.bot) {
        TicketLog.addMessage(ticketChannel.id, msg.author.tag, msg);
      }
    });

    await btn.reply({
      content: `Dein Ticket wurde erstellt: ${ticketChannel}`,
      ephemeral: true,
    });
  },

  async handleTicketButtons(btn: ButtonInteraction) {
    if (
      ![
        "claim_ticket",
        "close_ticket",
        "confirm_close_yes",
        "confirm_close_no",
      ].includes(btn.customId)
    )
      return;

    const member = btn.member as GuildMember;
    const teamRoleId = process.env.TEAM_ROLE!;
    const logChannelId = process.env.LOG_CHAT!;
    const channel = btn.channel as TextChannel;

    if (btn.customId === "claim_ticket") {
      if (!member.roles.cache.has(teamRoleId)) {
        await btn.reply({
          content: "Keine Berechtigung, um dieses Ticket anzunehmen!",
          ephemeral: true,
        });
        return;
      }

      if (channel.topic?.includes("claimed by:")) {
        await btn.reply({
          content: "Dieses Ticket wurde bereits übernommen!",
          ephemeral: true,
        });
        return;
      }

      await btn.deferReply({ ephemeral: true });
      await channel.setTopic(
        `${channel.topic || ""} | claimed by: ${member.user.tag}`,
      );
      await channel.send(`Ticket wurde von <@${member.id}> übernommen!`);
      await btn.deleteReply();
      return;
    }

    if (btn.customId === "close_ticket") {
      await btn.reply({
        embeds: [
          ConfirmCloseEmbed(
            "Ticket schließen?",
            "Möchtest du dieses Ticket wirklich schließen?",
          ),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("confirm_close_yes")
              .setLabel("Ja ✅")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("confirm_close_no")
              .setLabel("Nein ❌")
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    if (btn.customId === "confirm_close_yes") {
      await btn.deferReply({ ephemeral: true });
      const logChannel = btn.guild?.channels.cache.get(
        logChannelId,
      ) as TextChannel;
      if (logChannel) {
        await TicketLog.sendLogAndClear(channel.id, logChannel);
      }
      await btn.deleteReply();
      await channel.delete().catch(() => {});
      return;
    }

    if (btn.customId === "confirm_close_no") {
      await btn.reply({
        content: "Ticket bleibt geöffnet!",
        ephemeral: true,
      });
      return;
    }
  },
};
