import {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events,
  PermissionsBitField,
} from "discord.js";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Send ticket buttons in support channel
client.once(Events.ClientReady, async () => {
  const guild = await client.guilds.fetch(process.env.TICKET_GUILD_ID);
  const channel = await guild.channels.fetch(process.env.TICKET_SUPPORT_CHANNEL_ID);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("general_support")
      .setLabel("🟢 General Support")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("technical_support")
      .setLabel("🔧 Technical Support")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("payment_issues")
      .setLabel("💳 Payment Issues")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("business_inquiries")
      .setLabel("💼 Business Inquiries")
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎫 Need Assistance?")
    .setDescription(
      "Select a support category below to open a ticket.\n\nA staff member will review your request and respond as soon as possible."
    )
    .setFooter({ text: "Promote.fun Support" });

  await channel.bulkDelete(10).catch(() => {});
  await channel.send({ embeds: [embed], components: [row] });
});

// Interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  // --- Open ticket modal ---
  if (interaction.isButton() && interaction.customId !== "close_ticket") {
    const categories = {
      general_support: "General Support",
      technical_support: "Technical Support",
      payment_issues: "Payment Issues",
      business_inquiries: "Business Inquiries",
    };

    const category = categories[interaction.customId];
    if (!category) return;

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${interaction.customId}`)
      .setTitle("Open a Support Ticket");

    const catInput = new TextInputBuilder()
      .setCustomId("ticket_category")
      .setLabel("Ticket Category")
      .setStyle(TextInputStyle.Short)
      .setValue(category)
      .setRequired(true);

    const issueInput = new TextInputBuilder()
      .setCustomId("ticket_issue")
      .setLabel("What do you need help with?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const userInput = new TextInputBuilder()
      .setCustomId("ticket_username")
      .setLabel("Promote.fun Username")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(catInput),
      new ActionRowBuilder().addComponents(issueInput),
      new ActionRowBuilder().addComponents(userInput)
    );

    await interaction.showModal(modal);
  }

  // --- Ticket creation ---
  if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
    const category = interaction.fields.getTextInputValue("ticket_category");
    const issue = interaction.fields.getTextInputValue("ticket_issue");
    const username = interaction.fields.getTextInputValue("ticket_username");

    const guild = await client.guilds.fetch(process.env.TICKET_GUILD_ID);

    // Create ticket channel under Open Tickets category
    const ticketChannel = await guild.channels.create({
      name: `ticket-${interaction.user.username}-${Date.now()}`,
      type: 0, // text channel
      parent: process.env.TICKET_OPEN_CATEGORY_ID,
      permissionOverwrites: [
        {
          id: interaction.user.id,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
        },
        {
          id: process.env.TICKET_SUPPORT_ROLE_ID,
          allow: ["ViewChannel", "SendMessages", "ManageMessages", "ReadMessageHistory"],
        },
        {
          id: guild.roles.everyone.id,
          deny: ["ViewChannel"],
        },
      ],
    });

    // Embed for ticket info
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🎟️ New Support Ticket")
      .addFields(
        { name: "Category", value: category, inline: true },
        { name: "Promote.fun Username", value: username, inline: true },
        { name: "Issue", value: issue }
      )
      .setFooter({ text: `Submitted by ${interaction.user.tag}` })
      .setTimestamp();

    // Close ticket button
    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `<@&${process.env.TICKET_SUPPORT_ROLE_ID}>`,
      embeds: [embed],
      components: [closeRow],
    });

    await interaction.reply({
      content: `✅ Your ticket has been created: ${ticketChannel}`,
      ephemeral: true,
    });
  }

  // --- Close ticket ---
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Allow only support role or guild owner to close
    if (
      !member.roles.cache.has(process.env.TICKET_SUPPORT_ROLE_ID) &&
      interaction.guild.ownerId !== member.id
    ) {
      return interaction.reply({ content: "❌ You cannot close tickets.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const ticketChannel = interaction.channel;

    // Move ticket to Closed category
    await ticketChannel.setParent(process.env.TICKET_CLOSED_CATEGORY_ID);

    // Lock the channel for the ticket creator
    await ticketChannel.permissionOverwrites.edit(interaction.user.id, {
      SendMessages: false,
      ViewChannel: true,
      ReadMessageHistory: true,
    });

    // Notify inside the ticket
    await ticketChannel.send({
      content: `🔒 Ticket closed by ${interaction.user.tag}`,
    });

    await interaction.editReply({
      content: "✅ Ticket has been closed and moved to Closed Tickets.",
    });
  }
  const app = express();
  app.get("/", (req, res) => res.send("Verification bot is running!"));
  app.listen(3001, () => console.log("Verification bot web server running"));
});

client.login(process.env.TICKET_DISCORD_TOKEN);
