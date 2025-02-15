const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables

class DataManager {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir);
        }
        this.setupGitConfig();
        this.setupAutoPush();
    }

    saveData(filename, data) {
        const filePath = path.join(this.dataDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Data saved to ${filePath}`);
    }

    loadData(filename) {
        const filePath = path.join(this.dataDir, filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return null;
    }

    setupGitConfig() {
        const gitUrl = `https://${process.env.GITHUB_USERNAME}:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPO}.git`;

        // Initialize Git if not already initialized
        exec('git init', (initError) => {
            if (initError) {
                console.error('Error initializing Git:', initError);
                return;
            }
            console.log('Git initialized successfully.');

            // Set the remote URL
            exec(`git remote set-url origin ${gitUrl}`, (remoteError) => {
                if (remoteError) {
                    console.error('Error setting git remote:', remoteError);
                    return;
                }
                console.log('Git remote URL set successfully.');
            });
        });
    }

    setupAutoPush() {
        // Push data every hour
        setInterval(() => {
            this.pushToGitHub();
        }, 60 * 60 * 1000); // 1 hour in milliseconds
    }

    async pushToGitHub() {
        try {
            // Ensure the data directory is tracked by Git
            await this.executeCommand('git add data/*');
            await this.executeCommand('git commit -m "Auto-save data backup"');
            await this.executeCommand('git push origin main');
            console.log('Data successfully pushed to GitHub.');
        } catch (error) {
            console.error('Error pushing data to GitHub:', error);
        }
    }

    executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing ${command}:`, stderr);
                    reject(stderr);
                } else {
                    console.log(`${command} executed successfully:`, stdout);
                    resolve(stdout);
                }
            });
        });
    }
}

module.exports = new DataManager();
