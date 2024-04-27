import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import Discord from 'discord.js';
import ytdl from 'ytdl-core';

let queue = [];
const player = createAudioPlayer({
  behaviors: { noSubscriber: NoSubscriberBehavior.Pause }
});
let connection;

async function play(textChannel, ytLink) {
  const audioInfo = await ytdl.getInfo(ytLink);
  const audio = {
    link: audioInfo.videoDetails.video_url,
    title: audioInfo.videoDetails.title
  };
  console.log(audio);
  textChannel.send(`To play: ${audio.title}`);
  const resource = createAudioResource(
    ytdl(audio.link, { filter: 'audioonly' })
  );
  queue.push(resource);
  connection.subscribe(player);
  playAudio(connection);
}

function playAudio(connection) {
  player.play(queue.shift());
  player.on('finish', () => {
    if (queue.length) {
      playAudio(connection);
    } else {
      stop(connection);
      // connection.destroy(); // TODO, implement with timeout.
    }
  });
}

play(undefined, 'https://www.youtube.com/watch?v=FDqtA3Drrh0');

function stop(textChannel) {
  queue = [];
  if (connection) {
    player.stop();
    connection.destroy();
    textChannel.send('A mimir... 😴');
  } else {
    textChannel.send('🙄');
  }
}

const client = new Discord.Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildVoiceStates",
  ],
  presence: {
    status: 'dnd'
  }
});
const prefix = 'mico ';
const prefixLength = prefix.length;
const playCommand = 'toca';
const stopCommand = 'para';
const availableCommands = [
  playCommand,
  stopCommand
];

client.once('ready', () => {
  console.log(`Llegó ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  const {
    author,
    channel: textChannel,
    content,
    member,
  } = message;

  // Not a command.
  if (!content.startsWith(prefix) || author.bot) {
    return;
  }

  const { channel: voiceChannel } = member.voice;

  // User not in a voice channel.
  if (voiceChannel === null) {
    textChannel.send('Fuera del canal de voz no hay música!');
    return;
  }

  const slicedContent = content.split(' ');
  const command = slicedContent[0].slice(prefixLength).toLowerCase();

  // Command not available.
  if (!availableCommands.includes(command)) {
    textChannel.send('?');
    return;
  }

  const ytLink = slicedContent[1];

  // No (valid) link has been provided.
  if (!ytLink.match(/^https:\/\/(www\.)+youtube\.com\/watch\?v=*/)) {
    textChannel.send('?');
    return;
  }

  connection = joinVoiceChannel({
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    channelId: voiceChannel.id,
    guildId: voiceChannel.guildId,
  });

  switch (command) {
    case playCommand:
      play(textChannel, ytLink);
      break;
    case stopCommand:
      stop(textChannel);
      break;
    default:
      message.channel.send('?');
  }
});

client.login(process.env.BOT_TOKEN);
