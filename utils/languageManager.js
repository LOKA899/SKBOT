
const { translate } = require("@vitalets/google-translate-api");
const supabase = require('./supabaseClient');

class LanguageManager {
    constructor() {}

    async setUserPreference(userId, language) {
        try {
            const { error } = await supabase
                .from('language_preferences')
                .upsert({ 
                    user_id: userId, 
                    language: language 
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error setting language preference:', error);
            throw error;
        }
    }

    async getUserPreference(userId) {
        try {
            const { data, error } = await supabase
                .from('language_preferences')
                .select('language')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data?.language || "en";
        } catch (error) {
            console.error('Error getting language preference:', error);
            return "en";
        }
    }

    async translateMessage(text, targetLang) {
        try {
            const result = await translate(text, { to: targetLang });
            return result.text;
        } catch (error) {
            console.error("Translation error:", error);
            return text;
        }
    }
}

module.exports = new LanguageManager();
