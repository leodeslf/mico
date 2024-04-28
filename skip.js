import { ChatInputCommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function skip(interaction) {
  await interaction.deferReply();
  const queue = useQueue(interaction.guild);
  if (!queue || !queue.isPlaying()) {
    await interaction.followUp(rpl('🦧 no quedan más temas.'));
    return;
  }
  queue.node.skip();
  await interaction.followUp(rpl('🐎 pasando a la siguiente...'));
  return;
}
