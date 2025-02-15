const { Client, GatewayIntentBits, Collection, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const permissionChecker = require('./utils/permissionChecker');
const http = require('http'); // Import the http module

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Get all commands from the commands folder
        const commands = [];
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            }
        }

        // Register commands with Discord
        await rest.put(
            Routes.applicationCommands(config.clientId), // Use your bot's client ID
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

// Event handlers
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} commands`);
    console.log('Admin Role ID:', config.adminRoleId);
    console.log('Moderator Role ID:', config.moderatorRoleId);
    console.log('Participant Role ID:', config.participantRoleId);
    console.log('Bot is ready to process commands!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            // Defer the reply to avoid the "Unknown interaction" error
            await interaction.deferReply({ ephemeral: true });

            // Execute the command
            await command.execute(interaction);
            console.log(`Successfully executed command: ${interaction.commandName}`);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            }
        }
    }

    if (interaction.isButton()) {
        const [action] = interaction.customId.split('_');

        // Skip role check for joining the lottery
        if (action === 'join') {
            const buttonHandler = require('./utils/buttonHandlers');
            try {
                // Defer the reply to avoid the "Unknown interaction" error
                await interaction.deferReply({ ephemeral: true });

                console.log(`Processing button interaction: ${interaction.customId}`);
                await buttonHandler.handleButton(interaction);
                console.log(`Successfully processed button: ${interaction.customId}`);
            } catch (error) {
                console.error('Button interaction error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'There was an error processing this button!',
                        ephemeral: true
                    });
                } else {
                    await interaction.followUp({
                        content: 'There was an error processing this button!',
                        ephemeral: true
                    });
                }
            }
            return;
        }

        // For other button interactions, handle them as usual
        const buttonHandler = require('./utils/buttonHandlers');
        try {
            // Defer the reply to avoid the "Unknown interaction" error
            await interaction.deferReply({ ephemeral: true });

            console.log(`Processing button interaction: ${interaction.customId}`);
            await buttonHandler.handleButton(interaction);
            console.log(`Successfully processed button: ${interaction.customId}`);
        } catch (error) {
            console.error('Button interaction error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error processing this button!',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: 'There was an error processing this button!',
                    ephemeral: true
                });
            }
        }
    }
});

// Error handling for uncaught exceptions
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// HTTP server to keep bot alive on hosting platforms like Render
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running\n');
  })
  .listen(process.env.PORT || 3000)
  .on('error', (error) => {
    console.error('HTTP server error:', error);
  });

client.login(config.token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
