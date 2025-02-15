const config = require('../config');

function hasPermission(member, command) {
    if (command === 'sd' || command === 'raffle') {
        return member.roles.cache.has(config.moderatorRoleId);
    }
    return true; // Allow everyone to use other commands
}

function getMissingPermissionMessage(command) {
    if (command === 'sd' || command === 'raffle') {
        return 'You need the Moderator role to use this command!';
    }
    return 'You do not have permission to use this command!';
}

module.exports = {
    hasPermission,
    getMissingPermissionMessage
};
