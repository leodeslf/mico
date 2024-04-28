import { Client, GuildMember, GatewayIntentBits } from "discord.js";
import { Player, QueryType } from "discord-player";
import slashCommands from "./slashCommands.json";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

client.once('ready', async () => {
  console.log(`Llegó Mico! [${client.user.tag}]`)
  await client.application.fetch()
});
client.login(process.env.BOT_TOKEN);

const prefix = 'mico ';
const prefixLength = prefix.length;
const commandDeploy = 'deploy';

client.on('messageCreate', async message => {
  await message.fetch();
  // await message.guild.fetch()
  // await message.author.fetch();
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const command = message.content.slice(prefixLength).toLowerCase();
  if (command === commandDeploy) {
    await message.guild.commands.set(slashCommands);
    return void message.reply('Comandos desplegados! 🎤');
  }

  message.reply('🤨');
});

const player = new Player(client);
const slashCommandPlay = 'toca';
const slashCommandStop = 'para';
const slashCommandNext = 'pasa';
const reply = content => ({ content, ephemeral: true });

client.on('interactionCreate', async interaction => {
  await interaction.guild.fetch();
  if (!interaction.isCommand() || !interaction.guildId) return;
  await interaction.member.fetch();
  await interaction.member.voice.channel.fetch()
  if (
    !(interaction.member instanceof GuildMember) ||
    !interaction.member.voice.channel.fetch()
  ) {
    return void interaction.followUp(reply('Solo para canales de voz! 📢'));
  }
  // await interaction.guild.members.fetch();
  // await interaction.guild.members.me.fetch();
  if (
    interaction.guild.members.me.voice.channelId &&
    interaction.member.voice.channelId !==
    interaction.guild.members.me.voice.channelId
  ) {
    return void interaction.followUp(
      reply('No estamos en el mismo canal de voz! 📢')
    );
  }

  await interaction.deferReply();
  const query = interaction.options.get("query").value;

  if (!query.match(/https/)) return void interaction.reply(
    reply('Eso es una URL? 🤨')
  );

  switch (interaction.commandName) {
    case slashCommandPlay:
      play(interaction, query);
      break;
    case slashCommandNext:
      next(interaction);
      break;
    case slashCommandStop:
      stop(interaction);
      break;
    default:
  }
});

async function play(interaction, query) {
  const sourceMatch = query.match(/https.+com\//)?.[0];
  let queryType = 'SEARCH'; // Default, any search on any source.

  if (sourceMatch === 'https://www.youtube.com/') {
    queryType = 'YOUTUBE_VIDEO';
  } else if (sourceMatch === 'https://open.spotify.com/') {
    queryType = 'SPOTIFY_SONG';
  }

  const searchResults = await player.search(
    query,
    {
      requestedBy: interaction.member.user,
      searchEngine: QueryType[queryType]
    }
  );

  if (searchResults.isEmpty()) {
    return void interaction.followUp(reply('Búsqueda sin éxito... 🤔'));
  }

  const queue = player.queues.create(
    interaction.guild, { metadata: interaction.channel }
  );

  try {
    if (!queue.connection) {
      await queue.connect(interaction.member.voice.channel);
    }
  } catch {
    void player.queues.delete(interaction.guildId);
    return void interaction.followUp(
      reply('Mico no pudo unirse al canal de voz! 😭')
    );
  }

  await interaction.followUp(
    reply(`Cargando ${searchResults.playlist ? 'playlist' : 'canción'}... 😉`)
  );
  queue.addTrack(searchResults.tracks);
  if (!queue.isPlaying()) await queue.play();
  player.play(interaction.guild.me.voice.channel, searchResults[0]);
}

async function next(interaction) {
  await interaction.deferReply();
  const queue = player.queues.get(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    return void interaction.followUp(reply('No hay siguiente... 😶'));
  }
  const currentTrack = queue.currentTrack;
  const success = queue.removeTrack(currentTrack);
  return void interaction.followUp(
    reply(success ? 'Ok, pasamos... ⏭' : 'Algo salió mal! 💩')
  );
}

async function stop(interaction) {
  await interaction.deferReply();
  const queue = player.queues.get(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    return void interaction.followUp(reply('No hay siguiente... 😶'));
  }
  queue.delete();
  return void interaction.followUp(
    reply('A mimir? 😕')
  );
}
