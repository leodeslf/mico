import { Client, GuildMember, GatewayIntentBits } from "discord.js";
import { Player } from "discord-player";
import slashCommands from "./slashCommands.json" assert { type: 'json' };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ]
});
client.once('ready', async () => {
  console.log(`Llegó Mico! [${client.user.tag}] 🎤`);
  await client.application.fetch();
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
    await message.reply('🐄 ya podés usar `/toca`, `/para`, `/pasa`.');
    return;
  }
  await message.reply('🦘 eso no sirve...');
});

const player = new Player(client);
player.extractors.loadDefault();
const slashCommandPlay = 'toca';
const slashCommandStop = 'para';
const slashCommandNext = 'pasa';
const rpl = content => ({ content, ephemeral: true });

client.on('interactionCreate', async interaction => {
  await interaction.guild.fetch();
  if (!interaction.isChatInputCommand()) return;
  await interaction.member.fetch();
  if (
    !(interaction.member instanceof GuildMember) ||
    !interaction.member.voice.channel
  ) {
    await interaction.followUp(rpl('🦗 primero entrá a un canal de voz...'));
    return;
  }
  if (
    interaction.guild.members.me.voice.channelId &&
    interaction.member.voice.channelId !==
    interaction.guild.members.me.voice.channelId
  ) {
    await interaction.followUp(rpl('🦆 unámonos en el mismo canal de voz...'));
    return;
  }
  const query = interaction.options.data[0]?.value;
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
  await interaction.deferReply();
  const searchResults = await player.search(query);
  if (searchResults.isEmpty()) {
    await interaction.followUp(rpl('🐝 búsqueda sin éxito...'));
    return;
  }
  await interaction.channel.fetch();
  let queue = player.queues.get(interaction.guild);
  if (!queue) {
    queue = player.queues.create(
      interaction.guild,
      { metadata: interaction.channel }
    );
  }
  try {
    if (!queue.connection) {
      await queue.connect(interaction.member.voice.channel);
    }
  } catch {
    player.queues.delete(interaction.guildId);
    await interaction.followUp(rpl('🦖 mico no pudo unirse al canal de voz!'));
    return;
  }
  if (searchResults.playlist) {
    await interaction.followUp(
      rpl(`🦔 agregando **${searchResults.playlist.title}** (playlist).`)
    );
  } else {
    const { title, duration, author } = searchResults.tracks[0];
    await interaction.followUp(
      rpl(`🦔 agregando **${title}** (${duration}), de ${author}`)
    );
  }
  queue.addTrack(searchResults.tracks);
  if (!queue.isPlaying()) await queue.play(searchResults.tracks);
  await player.play(
    interaction.guild.members.me.voice.channel,
    searchResults.tracks[0],
    { nodeOptions: { volume: .5 } }
  );
}

async function next(interaction) {
  await interaction.deferReply();
  const queue = player.queues.get(interaction.guild);
  if (!queue || !queue.isPlaying()) {
    await interaction.followUp(rpl('🦧 no quedan más temas.'));
    return;
  }
  // const success = queue.removeTrack(queue.currentTrack);
  player.events.emit("playerSkip", queue, queue.currentTrack, 'MANUAL', 'Yes.');
  await interaction.followUp(
    rpl(success ? '🐎 siguiente...' : '🐞 no se puedo...')
  );
  return;
}

async function stop(interaction) {
  await interaction.deferReply();
  const queue = player.queues.get(interaction.guild);
  if (!queue || !queue.isPlaying()) {
    await interaction.followUp(rpl('🐌 qué querés parar?'));
    return;
  }
  queue.clear();
  await interaction.followUp(rpl('🦥 listo, a mimir!'));
  return;
}
