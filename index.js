import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder,
  Events
} from "discord.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config(); // loads combined .env

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    // Only send message if the member doesn't already have the verified role
    const verifiedRole = member.guild.roles.cache.get(process.env.VERIF_ROLE_ID);
    if (member.roles.cache.has(verifiedRole?.id)) return;

    const channel = await member.guild.channels.fetch(process.env.VERIF_VERIFY_CHANNEL_ID);
    if (!channel) return console.error("❌ Verify channel not found!");

    const embed = new EmbedBuilder()
      .setColor(0x41e713)
      .setTitle("👋 Welcome to Promote.Fun!")
      .setDescription(
        "**[promote.fun](https://promote.fun/)** is a platform where creators post branded content and get paid based on views.\n\n" +
        "You don't need any followers to get views, just start posting.\n\n" +
        "To get full access, click the ✅ **Verify Me** button below.\n\n" +
        "**Once you're verified, you'll be able to:**\n" +
        "• Start earning for views\n" +
        "• View active campaigns\n" +
        "• Talk with the community\n" +
        "• Access our full resource guide"
      );

    const button = new ButtonBuilder()
      .setCustomId("verify_me")
      .setLabel("✅ Verify Me")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error("Error sending verification message:", err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "verify_me") return;

  const role = interaction.guild.roles.cache.get(process.env.VERIF_ROLE_ID);
  if (!role) return interaction.reply({ content: "❌ Member role not found.", ephemeral: true });

  try {
    await interaction.member.roles.add(role);
    await interaction.reply({ content: "✅ You’ve been verified! Welcome!", ephemeral: true });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: "⚠️ Failed to assign role.", ephemeral: true });
  }
});

const app = express();
app.get("/", (req, res) => res.send("Verification bot is running!"));
app.listen(3001, () => console.log("Verification bot web server running"));

client.login(process.env.VERIF_DISCORD_TOKEN);
