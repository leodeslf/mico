import Discord from 'discord.js';
import ytdl from 'ytdl-core';

Discord.intents

// const appId = '1233589799240073226';
// const publicKey = '2730f6dbc25e9b13b116883e3bd8cc512360acdce4ac2d329a44325ff0721e84';
const token = process.env.BOT_TOKEN;
const client = new Discord.Client({
  intents: ["Guilds", "GuildMessages"]
});
let queue = [];
const outOfVoiceError = 'Fuera del canal de voz no se puede.';
const playCommand = 'toca';
const stopCommand = 'para';

client.on('ready', () => {
  console.log(`Llegó ${client.user.tag}!`);
});

async function play(message, args) {
  const { voiceChannel } = message.member;

  if (!voiceChannel) return message.channel.send(outOfVoiceError);
  if (!args[0]) return message.channel.send('Y el link?');

  const stream = ytdl(args[0], { filter: 'audioonly' });
  const connection = await voiceChannel.join();

  queue.push(stream); // THe actual addition.

  if (!connection.dispatcher) playSong(connection, queue);
}

function playSong(connection, queue) {
  const stream = queue.shift();
  stream.on('end', () => {
    if (queue.length > 0) {
      playSong(connection, queue);
    } else {
      connection.disconnect();
    }
  });

  connection.play();
}

function stop(message) {
  const { voiceChannel } = message.member;

  if (!voiceChannel) return message.channel.send(outOfVoiceError);

  if (voiceChannel.connection) {
    queue = [];
    voiceChannel.connection.disconnect();
    message.channel.send('A mimir... 😴');
  } else {
    message.channel.send('No ta tocando nada... 🙄');
  }
}

const prefix = '!';
const prefixLength = prefix.length;

client.on('message', message => {
  if (!message.content.startWith(prefix)) {
    return;
  }

  const command = message.content.slice(prefixLength).split(' ').shift().toLowerCase();
  const args = message.content.slice(prefixLength).split(' ').slice(1);

  switch (command) {
    case playCommand:
      play(message, args);
      break;
    case stopCommand:
      stop(message, args);
      break;
  }
});

client.login(token);
