import { ChatInputCommandInteraction } from "discord.js";
import { useMainPlayer, useQueue } from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 * @param {string} query 
 */
export default async function play(interaction, query, force) {
  await interaction.deferReply();
  const player = useMainPlayer(interaction.guildId);
  const queue = useQueue(interaction.guildId);
  // TODO, select search engine.
  const searchResults = await player
    .search(query, { requestedBy: interaction.user, searchEngine })
    .catch(() => null);
  if (!searchResults?.hasTracks()) {
    await interaction.followUp(rpl('🐝 búsqueda sin éxito...'));
    return;
  }
  if (searchResults.playlist) {
    const { title, estimatedDuration, author, tracks } = searchResults.playlist;
    await interaction.followUp(
      rpl(`🐘 tocando playlist...\n**${title}** (~${estimatedDuration}) [${tracks.length} items]\n*${author}*.`)
    );
  } else {
    const { title, duration, author } = searchResults.tracks[0];
    await interaction.followUp(
      rpl(`🦔 tocando...\n**${title}** (${duration})\n*${author}*`)
    );
  }
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
    await interaction.followUp(rpl(`🦎 algo salió mal...`));
    console.error(error);
  }
}
