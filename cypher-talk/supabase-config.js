// supabase-config.js (updated)
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AuthService = {
    async signUp(username, password, email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert({
                    username: username,
                    password: password, // In production, hash this!
                    email: email
                })
                .select()
                .single();

            if (error) throw error;
            
            // Store user session
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                username: data.username,
                email: data.email,
                loggedIn: true
            }));
            
            return { success: true, user: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async signIn(username, password) {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (error) throw error;
            
            localStorage.setItem('user', JSON.stringify({
                id: user.id,
                username: user.username,
                email: user.email,
                loggedIn: true
            }));
            
            return { success: true, user };
        } catch (error) {
            return { success: false, error: 'Invalid username or password' };
        }
    },

    async checkUsernameAvailability(username) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single();

            return { available: !data };
        } catch (error) {
            // If no user found, it's available
            return { available: true };
        }
    }
};

const MessageService = {
    async sendMessage(senderUsername, recipientUsername, cipherType, key, encryptedContent, decryptedContent = null) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_username: senderUsername,
                    recipient_username: recipientUsername,
                    cipher_type: cipherType,
                    encryption_key: key,
                    encrypted_content: encryptedContent,
                    decrypted_content: decryptedContent
                })
                .select()
                .single();

            return { success: !error, data, error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getMessages(username) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_username.eq.${username},recipient_username.eq.${username}`)
            .order('created_at', { ascending: true });

        return { data, error };
    },

    async deleteAllMessages(username) {
        const { error } = await supabase
            .from('messages')
            .delete()
            .or(`sender_username.eq.${username},recipient_username.eq.${username}`);

        return { success: !error, error };
    }
};

export { supabase, AuthService, MessageService };