const config = require('../config');

class PermissionChecker {
    static hasPermission(member, command) {
        // If no member object (DM), only allow certain commands
        if (!member || !member.roles) {
            const dmAllowedCommands = ['hlp', 'skulls'];
            return dmAllowedCommands.includes(command);
        }

        // Admin role has access to everything
        if (member.roles.cache.has(config.adminRoleId)) {
            return true;
        }

        // Check moderator permissions
        if (member.roles.cache.has(config.moderatorRoleId)) {
            return config.rolePermissions.moderator.includes(command);
        }

        // Bypass role check for specific commands (e.g., joining the lottery)
        const bypassRoleCheckCommands = ['join']; // Add commands that don't require a role check
        if (bypassRoleCheckCommands.includes(command)) {
            return true; // Assume all users have permission for these commands
        }

        // Check participant permissions
        if (member.roles.cache.has(config.participantRoleId)) {
            return config.rolePermissions.participant.includes(command);
        }

        return false;
    }

    static getHighestRole(member) {
        if (member.roles.cache.has(config.adminRoleId)) return 'admin';
        if (member.roles.cache.has(config.moderatorRoleId)) return 'moderator';
        if (member.roles.cache.has(config.participantRoleId)) return 'participant';
        return 'none';
    }

    static getMissingPermissionMessage(command) {
        return `You do not have permission to use the \`${command}\` command. Please contact an administrator if you believe this is a mistake.`;
    }
}

module.exports = PermissionChecker;
