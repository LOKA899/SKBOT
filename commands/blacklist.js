
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const blacklistManager = require('../utils/blacklistManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage blacklisted users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to blacklist')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('User to blacklist')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for blacklisting')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('days')
                        .setDescription('Duration in days (0 for permanent)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove from blacklist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check if a user is blacklisted')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        try {
            switch (subcommand) {
                case 'add': {
                    const reason = interaction.options.getString('reason');
                    const days = interaction.options.getInteger('days');
                    const duration = days > 0 ? days * 24 * 60 * 60 * 1000 : null;

                    await blacklistManager.addToBlacklist(user.id, reason, duration, interaction.user.id);
                    await interaction.reply(`✅ ${user.toString()} has been blacklisted. Reason: ${reason}`);
                    break;
                }
                case 'remove': {
                    await blacklistManager.removeFromBlacklist(user.id);
                    await interaction.reply(`✅ ${user.toString()} has been removed from the blacklist.`);
                    break;
                }
                case 'check': {
                    const info = await blacklistManager.getBlacklistInfo(user.id);
                    if (info) {
                        const expiry = info.expiry_date ? new Date(info.expiry_date).toLocaleString() : 'Never';
                        await interaction.reply(`${user.toString()} is blacklisted.\nReason: ${info.reason}\nExpires: ${expiry}`);
                    } else {
                        await interaction.reply(`${user.toString()} is not blacklisted.`);
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Blacklist command error:', error);
            await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
        }
    },
};
