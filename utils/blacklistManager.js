
const supabase = require('./supabaseClient');

class BlacklistManager {
    async addToBlacklist(userId, reason, duration, moderatorId) {
        const expiryDate = duration ? new Date(Date.now() + duration) : null;
        
        const { error } = await supabase
            .from('blacklist')
            .upsert({
                user_id: userId,
                reason: reason,
                expiry_date: expiryDate,
                moderator_id: moderatorId,
                created_at: new Date()
            });

        if (error) throw error;
    }

    async removeFromBlacklist(userId) {
        const { error } = await supabase
            .from('blacklist')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }

    async isBlacklisted(userId) {
        const { data, error } = await supabase
            .from('blacklist')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) return false;
        
        if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
            await this.removeFromBlacklist(userId);
            return false;
        }

        return !!data;
    }

    async getBlacklistInfo(userId) {
        const { data, error } = await supabase
            .from('blacklist')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data;
    }
}

module.exports = new BlacklistManager();
