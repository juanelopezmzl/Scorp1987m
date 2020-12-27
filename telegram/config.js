'use strict'

const ENV_VARS = [
    'BOT_API_URL',
    'BOT_TOKEN',
    'MAIN_CHAT_ID',
    'MAIN_CHAT_URL',
    'ADMIN_CHAT_ID',
    'SECURITY_FILE_ID'
];

module.exports = {
    // Telegram Bot API
    apiDomain: process.env.BOT_API_URL,

    // Telegram Bot Token
    botToken: process.env.BOT_TOKEN,

    // Base URL for Telegram API calls
    get apiUrl(){
        return `${this.apiDomain}/bot${this.botToken}`
    },

    // Main Chat ID
    mainChatID: Number(process.env.MAIN_CHAT_ID),

    // Main Chat Join Link
    mainChatUrl: process.env.MAIN_CHAT_URL,

    // Telegram Admin Chat ID
    adminChatID: Number(process.env.ADMIN_CHAT_ID),

    // Telegram Security INSTRUCTION File ID
    securityFileId: process.env.SECURITY_FILE_ID,

    checkEnvVariables: function(){
        ENV_VARS.forEach(function(key){
            if(!process.env[key]){
                console.warn(`WARNING: Missing the environment variable ${key}`);
            }
        })
    }
}