
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
        .setDescription('The start date (YYYY-MM-DD)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('to_date')
        .setDescription('The end date (YYYY-MM-DD)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('node_type')
        .setDescription('The type of node (farm, crystalMine, or sealedMine)')
        .setRequired(true)
        .addChoices(
          { name: 'Farm', value: 'farm' },
          { name: 'Crystal Mine', value: 'crystalMine' },
          { name: 'Sealed Mine', value: 'sealedMine' }
        ))
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('The level of the node')
        .setRequired(true)),

  async execute(interaction) {
    const landId = interaction.options.getString('land_id');
    const fromDate = interaction.options.getString('from_date');
    const toDate = interaction.options.getString('to_date');
    const nodeType = interaction.options.getString('node_type');
    const level = interaction.options.getInteger('level');

    const contributions = await fetchLandContributions(landId, fromDate, toDate);
    if (!contributions || !contributions.data) {
      await interaction.reply({ content: 'Failed to fetch contributions. Please check the Land ID and date range.', ephemeral: true });
      return;
    }

    const filteredContributions = contributions.data.filter(contribution => contribution.continent === 61);
    if (filteredContributions.length === 0) {
      await interaction.reply({ content: 'No contributions found for Continent 61.', ephemeral: true });
      return;
    }

    const nodeData = nodeLevels[nodeType].find(node => node.level === level);
    if (!nodeData) {
      await interaction.reply({ content: 'Invalid node type or level.', ephemeral: true });
      return;
    }

    const expectedDevPoints = nodeData.expectedDevPoints;
    const offenders = filteredContributions
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

    const message = await interaction.reply({
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
  }
};
