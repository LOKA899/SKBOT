module.exports = {
    // Bot configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,

    // Command permissions
    adminRoleId: process.env.ADMIN_ROLE_ID || '1339134803944935426', // Fallback value
    moderatorRoleId: process.env.MODERATOR_ROLE_ID || '1339134803944935427', // Fallback value
    participantRoleId: process.env.PARTICIPANT_ROLE_ID || null, // No fallback value (skip role check)

    // Role permissions
    rolePermissions: {
        admin: ['sd', 'rsd', 'cnl', 'rm', 'draw', 'st', 'an', 'hlp'],
        moderator: ['st', 'an', 'hlp'],
        participant: ['hlp'] // This will be ignored if participantRoleId is null
    },

    // Lottery defaults
    defaultMaxTime: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    minTimeLimit: 60 * 1000, // 1 minute in milliseconds
    maxWinners: 10,
};
