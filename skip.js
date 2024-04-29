import { ChatInputCommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function skip(interaction) {
  const queue = useQueue(interaction.guild);
  if (!queue || !queue.node.isPlaying()) {
    return void await interaction.followUp({
      content: '🦧 no hay nada tocando.',
      ephemeral: true
    });
  }
  return void await interaction.followUp({
    content: queue.node.skip() ?
      `🐎 pasando a la siguiente... (${queue.tracks.data[0].title})` :
      '🐇 esa era la última.',
    ephemeral: false
  });
}
