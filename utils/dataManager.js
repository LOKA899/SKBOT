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

        // Set Git user name and email
        exec(`git config --global user.email "${process.env.GIT_EMAIL}"`, (emailError) => {
            if (emailError) {
                console.error('Error setting Git email:', emailError);
                return;
            }
            console.log('Git email set successfully.');

            exec(`git config --global user.name "${process.env.GIT_NAME}"`, (nameError) => {
                if (nameError) {
                    console.error('Error setting Git name:', nameError);
                    return;
                }
                console.log('Git name set successfully.');

                // Initialize Git if not already initialized
                exec('git init', (initError) => {
                    if (initError) {
                        console.error('Error initializing Git:', initError);
                        return;
                    }
                    console.log('Git initialized successfully.');

                    // Check if the remote 'origin' already exists
                    exec('git remote -v', (remoteCheckError, stdout) => {
                        if (remoteCheckError) {
                            console.error('Error checking Git remotes:', remoteCheckError);
                            return;
                        }

                        if (stdout.includes('origin')) {
                            // If 'origin' exists, update its URL
                            exec(`git remote set-url origin ${gitUrl}`, (remoteSetError) => {
                                if (remoteSetError) {
                                    console.error('Error setting Git remote URL:', remoteSetError);
                                    return;
                                }
                                console.log('Git remote URL updated successfully.');
                            });
                        } else {
                            // If 'origin' does not exist, add it
                            exec(`git remote add origin ${gitUrl}`, (remoteAddError) => {
                                if (remoteAddError) {
                                    console.error('Error adding Git remote:', remoteAddError);
                                    return;
                                }
                                console.log('Git remote
