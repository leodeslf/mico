import { ChatInputCommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function skip(interaction) {
  const queue = useQueue(interaction.guild);
  if (!queue || !queue.node.isPlaying()) {
    return void await interaction.followUp({
      content: '🦧 no estoy tocando nada.',
      ephemeral: true
    });
  }

  return void await interaction.followUp({
    content: queue.node.skip() ?
      '🐎 pasando a la siguiente...' :
      '🐇 esa era la última...',
    ephemeral: false
  });
}
