import { Client, GuildMember, GatewayIntentBits } from "discord.js";
import { Player, QueryType } from "discord-player";
import slashCommands from "./slashCommands.json";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  presence: {
    status: 'dnd'
  },
});

client.once('ready', () => console.log(`Llegó Mico! [${client.user.tag}]`));
client.login(process.env.BOT_TOKEN);

const prefix = 'mico ';
const prefixLength = prefix.length;
const commandDeploy = 'deploy';

client.on('messageCreate', async message => {
  if (message.content.startsWith('mico')) {
    message.reply(reply('mico debug'));
  }

  const { author, content, guild } = message;

  if (!client.application?.owner) await client.application.fetch();
  if (!content.startsWith(prefix) || author.bot) return;

  const command = content.slice(prefixLength).toLowerCase();

  if (command === commandDeploy && author.id !== client.application?.owner?.id) {
    await guild.commands.set(slashCommands);
    return void await message.reply('Comandos de Mico desplegados... 🎤');
  }

  message.reply('🤨');
});

const player = new Player(client);
const slashCommandPlay = 'toca';
const slashCommandStop = 'para';
const slashCommandNext = 'pasa';
const reply = content => ({ content, ephemeral: true });

client.on('interactionCreate', async interaction => {
  const { guild, member } = interaction;

  if (!interaction.isCommand() || !interaction.guildId) return;
  if (
    !(member instanceof GuildMember) ||
    !member.voice.channel || (
      guild.members.me.voice.channelId &&
      member.voice.channelId !== guild.me.voice.channelId
    )
  ) {
    return void interaction.reply(reply('Solo para canales de voz! 📢'));
  }

  await interaction.deferReply();
  const query = interaction.options.get("query").value;

  if (!query.match(/https/)) return void interaction.reply(
    reply('URL inválida.')
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
  const { guild } = interaction;
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
    guild, { metadata: interaction.channel }
  );

  try {
    if (!queue.connection) await queue.connect(interaction.member.voice.channel);
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
  player.play(guild.me.voice.channel, searchResults[0]);
}

async function next(interaction) {
  const { guildId } = interaction;
  await interaction.deferReply();
  const queue = player.queues.get(guildId);

  if (!queue || !queue.isPlaying()) return void interaction.followUp(
    reply('No hay siguiente... 😶')
  );

  const currentTrack = queue.currentTrack;
  const success = queue.removeTrack(currentTrack);
  return void interaction.followUp(
    reply(success ? 'Ok, pasamos... ⏭' : 'Algo salio mal! 💩')
  );
}

async function stop(interaction) {
  const { guildId } = interaction;
  await interaction.deferReply();
  const queue = player.queues.get(guildId);
  if (!queue || !queue.isPlaying()) return void interaction.followUp(
    reply('No hay siguiente... 😶')
  );
  queue.delete();
  return void interaction.followUp(
    reply('Mambo cortado con éxito. 😬')
  );
}
