const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchLandContributions } = require('../utils/api');
const nodeLevels = require('../utils/nodeLevels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rss')
    .setDescription('Check unfinished resource nodes for a specific land and date range.')
    .addStringOption(option =>
      option.setName('land_id')
        .setDescription('The Land ID to check')
        .setRequired(true))
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
          { name: 'RSS', value: 'RSS' },
          { name: 'Crystal Mine', value: 'CrystalMine' },
          { name: 'DSA', value: 'DSA' }
        ))
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('The level of the node')
        .setRequired(true)),

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
      console.log(`[RSS Command] Command received from user ${interaction.user.tag} (${interaction.user.id})`);
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true }).catch(console.error);
      }
      const landId = interaction.options.getString('land_id');
      const fromDate = interaction.options.getString('from_date');
      const toDate = interaction.options.getString('to_date');
      const nodeType = interaction.options.getString('node_type').toUpperCase();
      const level = interaction.options.getInteger('level');

      try {
        const response = await fetchLandContributions(landId, fromDate, toDate);
        if (!response || !response.contribution) {
          await interaction.editReply({ content: 'Failed to fetch contributions. Please check the Land ID and date range.' });
          return;
        }

        if (!response.contribution || response.contribution.length === 0) {
          await interaction.editReply({ content: 'No contributions found for Continent 61.' });
          return;
        }

        if (!nodeLevels[nodeType]) {
          await interaction.editReply({ content: `Invalid node type: ${nodeType}. Available types are: RSS, CrystalMine, DSA` });
          return;
        }

        const nodeData = nodeLevels[nodeType].find(node => node.level === level);
        if (!nodeData) {
          await interaction.editReply({ content: `Invalid level ${level} for node type ${nodeType}` });
          return;
        }

        const expectedDevPoints = nodeData.expectedDevPoints;
        const offenders = response.contribution
          .map(contribution => ({
            player: contribution.name,
            totalDevPoints: contribution.total,
            unfinishedDevPoints: expectedDevPoints - contribution.total
          }))
          .filter(player => player.unfinishedDevPoints > 0)
          .sort((a, b) => b.unfinishedDevPoints - a.unfinishedDevPoints);

        const pageSize = 5;
        let currentPage = 0;

        const generateEmbed = (page) => {
          const startIdx = page * pageSize;
          const currentOffenders = offenders.slice(startIdx, startIdx + pageSize);

          const embed = new EmbedBuilder()
            .setTitle(`📊 Unfinished ${nodeType} (Level ${level}) on Land ${landId}`)
            .setDescription(`**Expected Dev Points:** ${expectedDevPoints}\n**Total Offenders:** ${offenders.length}`)
            .setColor(0xFF0000)
            .setFooter({ text: `Page ${page + 1}/${Math.ceil(offenders.length / pageSize)}` })
            .setTimestamp();

          currentOffenders.forEach((offender, index) => {
            embed.addFields({
              name: `${startIdx + index + 1}. ${offender.player}`,
              value: `🎯 Total Dev Points: ${offender.totalDevPoints}\n❌ Missing: ${offender.unfinishedDevPoints}`
            });
          });

          return embed;
        };

        const generateButtons = (page) => {
          const row = new ActionRowBuilder()
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
                .setDisabled(page >= Math.ceil(offenders.length / pageSize) - 1),
              new ButtonBuilder()
                .setCustomId('last')
                .setLabel('⏭️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page >= Math.ceil(offenders.length / pageSize) - 1)
            );
          return row;
        };

        const message = await interaction.editReply({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
          fetchReply: true
        });

        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
            return;
          }

          switch (i.customId) {
            case 'first':
              currentPage = 0;
              break;
            case 'prev':
              currentPage = Math.max(0, currentPage - 1);
              break;
            case 'next':
              currentPage = Math.min(Math.ceil(offenders.length / pageSize) - 1, currentPage + 1);
              break;
            case 'last':
              currentPage = Math.ceil(offenders.length / pageSize) - 1;
              break;
          }

          await i.update({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)]
          });
        });

        collector.on('end', async () => {
          const finalEmbed = generateEmbed(currentPage)
            .setFooter({ text: 'Interaction timeout - Session ended' });
          await message.edit({
            embeds: [finalEmbed],
            components: []
          });
        });
      } catch (error) {
        console.error(`[RSS Command] Error executing command for user ${interaction.user.tag}:`, error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
        }
      }
    } catch (error) {
      console.error("Error in main try/catch", error);
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
        } catch (replyError) {
          console.error('Failed to send error response:', replyError);
        }
      }
    }
  }
};
