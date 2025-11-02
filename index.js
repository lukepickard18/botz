import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder,
  Events
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// Create bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // required to detect new joins
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// When someone joins the server
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channel = await member.guild.channels.fetch(process.env.VERIFY_CHANNEL_ID);
    if (!channel) return console.error("❌ Verify channel not found!");

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("👋 **Welcome to Promote.Fun!**\n\n")
      .setDescription(
            "Promote.fun is a platform where creators post branded content and get paid based on how many views they receive.\n\n" +
            "You don't need any followers to get views — all you need to do is start posting.\n\n" +
            "To get full access to the server, just click on the ✅ **Verify Me** button below.\n\n" +
            "Once you're verified, you'll be able to:\n" +
            "• Start earning for views\n" +
            "• View active campaigns\n" +
            "• Talk with the community\n" +
            "• Access our full resource guide"
)
      .setFooter({ text: "Verification System" });

    // Create button
    const button = new ButtonBuilder()
      .setCustomId("verify_me")
      .setLabel("✅ Verify Me")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    // Send message
    await channel.send({ content: `<@${member.id}>`, embeds: [embed], components: [row] });

  } catch (err) {
    console.error("Error sending verification message:", err);
  }
});

// Handle button click
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "verify_me") return;

  const role = interaction.guild.roles.cache.get(process.env.ROLE_ID);
  if (!role) return interaction.reply({ content: "❌ Member role not found.", ephemeral: true });

  try {
    await interaction.member.roles.add(role);
    await interaction.reply({ content: "✅ You’ve been verified! Welcome!", ephemeral: true });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: "⚠️ Failed to assign role.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);