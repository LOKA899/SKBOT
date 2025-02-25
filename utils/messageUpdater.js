
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const messageTemplates = require('./messageTemplates');

function createActionRow(lotteryId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`join_${lotteryId}`)
            .setLabel("🎟️ Join Lottery")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`view_${lotteryId}`)
            .setLabel("👥 View Participants")
            .setStyle(ButtonStyle.Secondary)
    );
}

async function updateLotteryMessage(channel, messageId, lottery, includeButtons = true) {
    try {
        const message = await channel.messages.fetch(messageId);
        const updatedEmbed = messageTemplates.createLotteryEmbed(lottery);

        const components = [];
        if (includeButtons && lottery.status === 'active') {
            components.push(createActionRow(lottery.id));
        }

        if (lottery.status === 'ended' || lottery.status === 'cancelled' || 
            (lottery.status === 'expired' && lottery.isManualDraw)) {
            components.length = 0;
        }

        const currentTime = Date.now();
        const lastEditTime = message.editedTimestamp || message.createdTimestamp;
        const timeSinceLastEdit = currentTime - lastEditTime;
        
        if (timeSinceLastEdit >= 1000 || lottery.status !== 'active') {
            try {
                await message.edit({
                    embeds: [updatedEmbed],
                    components: components,
                    flags: message.flags
                });
            } catch (error) {
                if (error.code !== 50001 && error.code !== 10008) {
                    console.error(`[Update] Update failed: ${error}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await message.edit({
                        embeds: [updatedEmbed],
                        components: components,
                        flags: message.flags
                    }).catch(retryError => {
                        console.error(`[Update] Retry failed: ${retryError}`);
                    });
                }
            }
        }

        return true;
    } catch (error) {
        console.error(`[Update] Error updating message for lottery ${lottery.id}:`, error);
        return false;
    }
}

module.exports = {
    updateLotteryMessage,
    createActionRow
};
