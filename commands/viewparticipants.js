
const { SlashCommandBuilder } = require('@discordjs/builders');
const { lotteryManager } = require('../utils/lotteryManager');
const messageTemplates = require('../utils/messageTemplates');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vp')
        .setDescription('View participants of any lottery')
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

        const participantMentions = [];
        for (const [participantId] of lottery.participants) {
            try {
                const user = await interaction.client.users.fetch(participantId);
                participantMentions.push(user.toString());
            } catch (error) {
                console.error(`Failed to fetch user ${participantId}:`, error);
                participantMentions.push("Unknown User");
            }
        }

        const participantsList = participantMentions.join('\n') || 'No participants yet';
        await interaction.reply({ 
            content: `**Participants:**\n${participantsList}`, 
            ephemeral: true 
        });
    }
};
