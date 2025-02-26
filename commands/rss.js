const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchLandContributions } = require('../utils/api');
const nodeLevels = require('../utils/nodeLevels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rss')
    .setDescription('Check unfinished resource nodes for a specific land and date range.')
    .addNumberOption(option =>
      option.setName('land_id')
        .setDescription('The Land ID to check')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option =>
      option.setName('from_date')
        .setDescription('The start date')
        .setRequired(true)
        .setAutocomplete(true))
    .addStringOption(option =>
      option.setName('to_date')
        .setDescription('The end date')
        .setRequired(true)
        .setAutocomplete(true))
    .addStringOption(option =>
      option.setName('node_type')
        .setDescription('The type of node (RSS, Crystal Mine, or DSA)')
        .setRequired(true)
        .addChoices(
          { name: 'RSS', value: 'rss' },
          { name: 'Crystal Mine', value: 'crystalMine' },
          { name: 'DSA', value: 'dsa' }
        ))
    .addNumberOption(option =>
      option.setName('level')
        .setDescription('The level of the node')
        .setRequired(true)),

  async autocomplete(interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      if (!['from_date', 'to_date'].includes(focusedOption.name)) return;

      // Simulate a delay (optional)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate dates for the last 7 days
      const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return { name: date.toISOString().split('T')[0], value: date.toISOString().split('T')[0] };
      });

      // Filter dates based on user input
      const filtered = dates.filter(date =>
        date.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );

      // Respond with filtered dates
      await interaction.respond(filtered.slice(0, 25));
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  },

  async execute(interaction) {
    try {
      // Defer the reply immediately to avoid timeout
      await interaction.deferReply({ ephemeral: true });

      const landId = interaction.options.getNumber('land_id');
      const fromDate = interaction.options.getString('from_date');
      const toDate = interaction.options.getString('to_date');
      const nodeType = interaction.options.getString('node_type');
      const level = interaction.options.getNumber('level');

      // Fetch contributions from the API
      const response = await fetchLandContributions(landId, fromDate, toDate);
      if (!response?.contribution) {
        await interaction.editReply({ content: 'Failed to fetch contributions. Please check the Land ID and date range.' });
        return;
      }

      // Get expected Dev Points for the node type and level
      const nodeData = nodeLevels[nodeType].find(node => node.level === level);
      if (!nodeData) {
        await interaction.editReply({ content: 'Invalid node type or level.' });
        return;
      }

      const expectedDevPoints = nodeData.expectedDevPoints;

      // Filter contributions for Continent 61 and calculate unfinished Dev Points
      const offenders = response.contribution
        .filter(contribution => contribution.continent === 61)
        .reduce((acc, contribution) => {
          const unfinishedDevPoints = expectedDevPoints - contribution.total;
          if (unfinishedDevPoints > 0) {
            acc.push({
              player: contribution.name,
              totalDevPoints: contribution.total,
              unfinishedDevPoints
            });
          }
          return acc;
        }, [])
        .sort((a, b) => b.unfinishedDevPoints - a.unfinishedDevPoints);

      // If no offenders, notify the user
      if (offenders.length === 0) {
        await interaction.editReply({ content: 'No unfinished contributions found for Continent 61.' });
        return;
      }

      // Pagination setup
      const pageSize = 5;
      let currentPage = 0;

      // Generate embed for the current page
      const generateEmbed = (page) => {
        const startIdx = page * pageSize;
        const currentOffenders = offenders.slice(startIdx, startIdx + pageSize);

        return new EmbedBuilder()
          .setTitle(`📊 Unfinished ${nodeType} (Level ${level}) on Land ${landId}`)
          .setDescription(`**Expected Dev Points:** ${expectedDevPoints}\n**Total Offenders:** ${offenders.length}`)
          .setColor(0xFF0000)
          .setFooter({ text: `Page ${page + 1}/${Math.ceil(offenders.length / pageSize)}` })
          .setTimestamp()
          .addFields(
            currentOffenders.map((offender, index) => ({
              name: `${startIdx + index + 1}. ${offender.player}`,
              value: `🎯 Total Dev Points: ${offender.totalDevPoints}\n❌ Missing: ${offender.unfinishedDevPoints}`
            }))
          );
      };

      // Generate buttons for pagination
      const generateButtons = (page) => {
        const maxPage = Math.ceil(offenders.length / pageSize) - 1;
        return new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('first')
              .setLabel('⏮️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('prev')
              .setLabel('◀️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('▶️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page >= maxPage),
            new ButtonBuilder()
              .setCustomId('last')
              .setLabel('⏭️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page >= maxPage)
          );
      };

      // Send the initial embed with buttons
      const message = await interaction.editReply({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
        fetchReply: true
      });

      // Create a collector for button interactions
      const collector = message.createMessageComponentCollector({ 
        time: 300000, 
        filter: i => i.user.id === interaction.user.id 
      });

      collector.on('collect', async i => {
        const maxPage = Math.ceil(offenders.length / pageSize) - 1;
        switch (i.customId) {
          case 'first': currentPage = 0; break;
          case 'prev': currentPage = Math.max(0, currentPage - 1); break;
          case 'next': currentPage = Math.min(maxPage, currentPage + 1); break;
          case 'last': currentPage = maxPage; break;
        }

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)]
        });
      });

      collector.on('end', async () => {
        try {
          const finalEmbed = generateEmbed(currentPage)
            .setFooter({ text: 'Interaction timeout - Session ended' });
          await message.edit({
            embeds: [finalEmbed],
            components: []
          });
        } catch (error) {
          console.error('Failed to handle collector end:', error);
        }
      });
    } catch (error) {
      console.error('RSS command error:', error);

      // Handle unknown interaction errors
      if (error.code === 10062) return;

      try {
        await interaction.editReply({
          content: 'An error occurred while processing the command.',
          ephemeral: true
        });
      } catch (e) {
        console.error('Failed to send error response:', e);
      }
    }
  }
};
