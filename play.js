import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import {
  useMainPlayer,/* , useQueue */
  useMetadata
} from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 * @param {string} query 
 */
export default async function play(interaction, query, force) {
  const player = useMainPlayer(interaction.guildId);
  // const queue = useQueue(interaction.guildId);
  // TODO, select search engine.
  const searchResults = await player
    .search(query, { requestedBy: interaction.user })
    .catch(() => null);
  if (!searchResults?.hasTracks()) {
    return void await interaction.followUp({
      content: '🐝 sin resultados de búsqueda...',
      ephemeral: true
    });
  }
  if (searchResults.playlist) {
    const { title, estimatedDuration, author, tracks } = searchResults.playlist;
    await interaction.followUp({
      content: `🐘 tocando playlist desde \`${source}\`...\n**${title}** (~${estimatedDuration}) [${tracks.length} items]\n*${author}*.`,
      ephemeral: false
    });
  } else {
    const { title, duration, author, source } = searchResults.tracks[0];
    await interaction.followUp({
      content: `🦔 tocando desde \`${source}\`...\n**${title}** (${duration})\n*${author}*`,
      ephemeral: false
    });
  }
  // if (interaction.member instanceof GuildMember) {
  const { channel } = interaction.member.voice;
  if (!interaction.guild.members.me.voice.channelId) {
    await player.queues
      .create(interaction.guildId)
      .connect(channel);
  }
  try {
    await player.play(
      channel,
      searchResults.tracks[0],
      {
        audioPlayerOptions: { queue: true },
        nodeOptions: {
          leaveOnEndCooldown: 1000 * 3,
          leaveOnEmptyCooldown: 1000 * 3,
          metadata: interaction.channel,
          repeatMode: 0,
          volume: 0.4,
        }
      }
    );
  } catch (error) {
    await interaction.followUp({
      content: `🦎 algo salió mal...`,
      ephemeral: true
    });
    console.error(error);
  }
  // }
}
