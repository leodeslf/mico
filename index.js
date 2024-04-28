import { Client, GuildMember, GatewayIntentBits } from "discord.js";
import { Player, QueryType } from "discord-player";
import slashCommands from "./slashCommands.json" assert { type: 'json' };

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
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const command = message.content.slice(prefixLength).toLowerCase();
  if (command === commandDeploy) {
    await message.guild.commands.set(slashCommands);
    await message.reply('Comandos desplegados! 🎤');
    return;
  }
  await message.reply('🤨');
});

const player = new Player(client);
player.extractors.loadDefault();
const slashCommandPlay = 'toca';
const slashCommandStop = 'para';
const slashCommandNext = 'pasa';
const rpl = content => ({ content, ephemeral: true });

client.on('interactionCreate', async interaction => {
  await interaction.deferReply();
  await interaction.guild.fetch();
  if (!interaction.isChatInputCommand()) return;
  await interaction.member.fetch();
  if (
    !(interaction.member instanceof GuildMember) ||
    !interaction.member.voice.channel
  ) {
    await interaction.followUp(rpl('Solo para canales de voz! 📢'));
    return;
  }
  if (
    interaction.guild.members.me.voice.channelId &&
    interaction.member.voice.channelId !==
    interaction.guild.members.me.voice.channelId
  ) {
    await interaction.followUp(rpl('No estamos en el mismo canal de voz! 📢'));
    return;
  }
  const query = interaction.options.data[0].value;
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

const fallbackSearchEngine = 'AUTO';
const youtubeUrl = 'https://www.youtube.com/'
const spotifyUrl = 'https://open.spotify.com/'

async function play(interaction, query) {
  console.log(query);
  const searchResults = await player.search(
    query,
    {
      searchEngine: QueryType[
        (query.includes(youtubeUrl) && 'YOUTUBE_VIDEO') ||
        (query.includes(spotifyUrl) && 'SPOTIFY_SONG') ||
        fallbackSearchEngine
      ]
    }
  );
  if (searchResults.isEmpty()) {
    await interaction.followUp(rpl('Búsqueda sin éxito... 🤔'));
    return;
  }
  const queue = player.queues.create(
    interaction.guild, { metadata: interaction.channel }
  );
  try {
    if (!queue.connection) {
      await queue.connect(interaction.member.voice.channel);
    }
  } catch {
    player.queues.delete(interaction.guildId);
    await interaction.followUp(rpl('Mico no pudo unirse al canal de voz! 😭'));
    return;
  }
  await interaction.followUp(
    rpl(`Cargando ${searchResults.playlist ? 'playlist' : 'canción'}... 😉`)
  );
  queue.addTrack(searchResults.tracks);
  if (!queue.isPlaying()) await queue.play();
  await player.play(interaction.guild.me.voice.channel, searchResults[0]);
}

async function next(interaction) {
  await interaction.deferReply();
  const queue = player.queues.get(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    await interaction.followUp(rpl('No hay siguiente... 😶'));
    return;
  }
  const currentTrack = queue.currentTrack;
  const success = queue.removeTrack(currentTrack);
  await interaction.followUp(
    rpl(success ? 'Ok, pasamos... ⏭' : 'Algo salió mal! 💩')
  );
  return;
}

async function stop(interaction) {
  await interaction.deferReply();
  const queue = player.queues.get(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    await interaction.followUp(rpl('No hay siguiente... 😶'));
    return;
  }
  queue.delete();
  await interaction.followUp(
    rpl('A mimir? 😕')
  );
  return;
}
