import { ChatInputCommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function skip(interaction) {
  await interaction.deferReply();
  const queue = useQueue(interaction.guild);
  if (!queue || !queue.isPlaying()) {
    return void await interaction.followUp({
      content: '🦧 no quedan más temas.',
      ephemeral: true
    });
  }
  queue.node.skip();
  return void await interaction.followUp({
    content: '🐎 pasando a la siguiente...',
    ephemeral: false
  });
}
