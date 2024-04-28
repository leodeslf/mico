import { Client, GatewayIntentBits, GuildMember } from "discord.js";
import { Player } from "discord-player";
import play from "./play.js";
import skip from "./skip.js";
import slashCommands from "./slashCommands.json" assert { type: 'json' };
import stop from "./stop.js";

process.on('unhandledRejection', reason => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ]
});
client.once('ready', async () => {
  console.debug(`Llegó Mico! [${client.user.tag}] 🎤`);
  await client.application.fetch();
});

const prefix = 'mico ';
const prefixLength = prefix.length;

client.on('messageCreate', async message => {
  await message.fetch();
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const command = message.content.slice(prefixLength).toLowerCase();
  if (command === 'deploy') {
    await message.guild.commands.set(slashCommands);
    return void await message.reply(
      '🐄 ya podés usar `/toca`, `/para`, `/pasa`.'
    );
  }
  await message.reply('🦘 eso no sirve...');
});

const player = new Player(client);
await player.extractors.loadDefault();
const slashCommandToFunctionMap = {
  toca: (interaction, query, force) => play(interaction, query, force),
  pasa: interaction => skip(interaction),
  para: interaction => stop(interaction),
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply();
  await interaction.guild.fetch();
  await interaction.member.fetch();
  if (
    !(interaction.member instanceof GuildMember) ||
    !interaction.member.voice.channel
  ) {
    return void await interaction.followUp({
      content: '🦗 primero entrá a un canal de voz...',
      ephemeral: true
    });
  }
  if (
    interaction.guild.members.me.voice.channelId &&
    interaction.member.voice.channelId !==
    interaction.guild.members.me.voice.channelId
  ) {
    return void await interaction.followUp({
      content: '🦆 ya estoy en otro canal de voz...',
      ephemeral: true
    });
  }
  await slashCommandToFunctionMap[interaction.commandName](
    interaction,
    interaction.options.getString('query'),
    interaction.options.getString('force'),
  );
});

client.login(process.env.BOT_TOKEN);
