
const { SlashCommandBuilder } = require('@discordjs/builders');
const { lotteryManager } = require('../utils/lotteryManager');
const messageTemplates = require('../utils/messageTemplates');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vl')
        .setDescription('View details of a concluded lottery')
        .addStringOption(option =>
            option.setName('lottery_id')
                .setDescription('ID of the lottery to view')
                .setRequired(true)),

    async execute(interaction) {
        const lotteryId = interaction.options.getString('lottery_id');
        const lottery = await lotteryManager.getLottery(lotteryId);

        if (!lottery) {
            await interaction.reply({ 
                content: 'Lottery not found!', 
                ephemeral: true 
            });
            return;
        }

        if (lottery.status === 'active') {
            await interaction.reply({
                content: 'This lottery is still active! Use /vp to see current participants.',
                ephemeral: true
            });
            return;
        }

        // Create winner mentions
        const winnerMentions = [];
        for (const winnerId of lottery.winnerList) {
            try {
                const user = await interaction.client.users.fetch(winnerId);
                winnerMentions.push(user.toString());
            } catch (error) {
                winnerMentions.push("Unknown User");
            }
        }

        const winnersList = winnerMentions.length > 0 ? winnerMentions.join('\n') : 'No winners';
        const status = lottery.status.charAt(0).toUpperCase() + lottery.status.slice(1);
        const endDate = new Date(lottery.endTime).toLocaleString();

        await interaction.reply({
            content: `**Lottery Details**\nPrize: ${lottery.prize}\nStatus: ${status}\nEnd Date: ${endDate}\n\n**Winners:**\n${winnersList}`,
            ephemeral: true
        });
    }
};
