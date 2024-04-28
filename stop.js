import { ChatInputCommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function stop(interaction) {
  const queue = useQueue(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    return void await interaction.followUp({
      content: '🐌 qué querés parar?',
      ephemeral: true
    });
  }
  queue.node.stop();
  return void await interaction.followUp({
    content: '🦥 listo, a mimir!',
    ephemeral: false
  });
}
