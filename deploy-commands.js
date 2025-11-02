// deploy-commands.js
import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'setupverify',
    description: 'Send the verification panel to the current channel',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Deploying slash commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  );
  console.log('✅ Commands deployed.');
} catch (err) {
  console.error(err);
}