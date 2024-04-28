import { ChatInputCommandInteraction } from "discord.js";
import { useMainPlayer/* , useQueue */ } from "discord-player";

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
      content: '🐝 búsqueda sin éxito...',
      ephemeral: true
    });
  }
  if (searchResults.playlist) {
    const { title, estimatedDuration, author, tracks } = searchResults.playlist;
    await interaction.followUp({
      content: `🐘 tocando playlist:\n**${title}** (~${estimatedDuration}) [${tracks.length} items]\n*${author}*.`,
      ephemeral: false
    });
  } else {
    const { title, duration, author } = searchResults.tracks[0];
    await interaction.followUp({
      content: `🦔 tocando:\n**${title}** (${duration})\n*${author}*`,
      ephemeral: false
    });
  }
  console.debug("CHANELLLL", interaction.guild.members.me);
  try {
    await player.play(
      interaction.guild.members.me.voice.channel,
      searchResults.tracks[0],
      {
        audioPlayerOptions: { queue: true },
        nodeOptions: {
          leaveOnEndCooldown: 1000 * 3,
          leaveOnEmptyCooldown: 1000 * 3,
          metadata: interaction.channel,
          repeatMode: 0,
          volume: 0.5,
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
}
