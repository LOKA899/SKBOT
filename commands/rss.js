const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchLandContributions } = require('../utils/api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rss')
    .setDescription('Fetch RSS data'),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const today = new Date();
    const dates = [];

    // Generate last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = date.toISOString().split('T')[0];
      dates.push({ name: formattedDate, value: formattedDate });
    }

    const filtered = dates.filter(date => date.name.startsWith(focusedValue));
    await interaction.respond(filtered);
  },

  async execute(interaction) {
    try {
      // Defer the reply immediately
      await interaction.deferReply();

      try {
        const data = await fetchLandContributions({
          landId: '133152',
          from: '2025-02-25',
          to: '2025-02-25'
        });

        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('RSS Data')
          .setDescription('Here is your requested data')
          .addFields(
            { name: 'Data', value: JSON.stringify(data, null, 2) }
          );

        await interaction.editReply({ embeds: [embed] });

      } catch (apiError) {
        console.error('API Error:', apiError);

        // Check if interaction is still valid before responding
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ 
            content: 'Sorry, there was an error fetching the data. Please try again later.',
            ephemeral: true 
          });
        }
      }

    } catch (error) {
      console.error('[RSS Command] Error:', error);

      try {
        // Handle various interaction states
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: 'An error occurred while processing your request.',
            ephemeral: true 
          });
        } else {
          await interaction.editReply({ 
            content: 'An error occurred while processing your request.',
            ephemeral: true 
          });
        }
      } catch (followUpError) {
        console.error('[RSS Command] Failed to send error response:', followUpError);
      }
    }
  },
};
