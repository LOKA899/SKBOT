
const { SlashCommandBuilder } = require('@discordjs/builders');
const { cleanupBotMessages } = require('../utils/messageUpdater');
const permissionChecker = require('../utils/permissionChecker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleanup')
        .setDescription('Clean up old bot messages')
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Delete messages older than X minutes')
                .setRequired(false)),

    async execute(interaction) {
        if (!permissionChecker.hasPermission(interaction.member, 'admin')) {
            await interaction.reply({
                content: 'You need admin permission to use this command.',
                ephemeral: true
            });
            return;
        }

        const minutes = interaction.options.getInteger('minutes') || 60;
        await cleanupBotMessages(interaction.channel, minutes);
        
        await interaction.reply({
            content: `Cleaned up bot messages older than ${minutes} minutes.`,
            ephemeral: true
        });
    }
};
