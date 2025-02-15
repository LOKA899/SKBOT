
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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
        exec(`git remote set-url origin ${gitUrl}`, (error) => {
            if (error) console.error('Error setting git remote:', error);
        });
    }

    setupAutoPush() {
        // Push data every hour
        setInterval(() => {
            this.pushToGitHub();
        }, 60 * 60 * 1000); // 1 hour in milliseconds
    }

    pushToGitHub() {
        const commands = [
            'git add data/*',
            'git commit -m "Auto-save data backup"',
            'git push origin main'
        ];

        for (const command of commands) {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing ${command}:`, error);
                    return;
                }
                console.log(`${command} executed successfully:`, stdout);
            });
        }
    }
}

module.exports = new DataManager();
