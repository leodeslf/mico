import { ChatInputCommandInteraction } from "discord.js";
import { useQueue } from "discord-player";

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function stop(interaction) {
  await interaction.deferReply();
  const queue = useQueue(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    await interaction.followUp(rpl('🐌 qué querés parar?'));
    return;
  }
  queue.node.stop();
  await interaction.followUp(rpl('🦥 listo, a mimir!'));
  return;
}
