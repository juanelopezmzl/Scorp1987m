'use strict';

const
    i18n = require('../i18n.config'),
    User = require('../types/user'),
    Payload = require('../types/payload'),
    config = require('./config'),
    botApi = require('./botApi'),
    { allowInvite, allowRegister, allowLogin, isReady, allowLogout, allowChangeLanguage, allowChangePin } = require('./check');

module.exports = {
    /**
     * 
     * @param {User} user 
     * 
     * Send welcome message to user
     */
    async sendWelcomeAsync(user){
        await botApi.sendTextMessageAsync(user.telegram_user_id, i18n.__('get_started.welcome', user));
    },

    /**
     * 
     * Send initial instruction to user
     */
    async sendInitialAsync(telegram_user_id){
        await botApi.sendMarkdownV2Photo(telegram_user_id, config.securityFileId, i18n.__('get_started.security'));
    },

    /**
     * 
     * @param {User} user 
     * 
     * Send help message to user
     */
    async sendHelpAsync(user){
        // const inline_keyboard = [];
        // if(allowChangeLanguage(user))
        //     inline_keyboard.push([{
        //         text: i18n.__('menu.language'),
        //         callback_data: 'LANGUAGE'
        //     }]);
        // if(allowRegister(user))
        //     inline_keyboard.push([{
        //         text: i18n.__('menu.register'),
        //         callback_data: 'REGISTER'
        //     }]);
        // if(allowInvite(user))
        //     inline_keyboard.push([{
        //         text: i18n.__('menu.invite'),
        //         callback_data: 'INVITE'
        //     }])
        // if(allowLogin(user))
        //     inline_keyboard.push([{
        //         text: i18n.__('menu.login'),
        //         callback_data: 'LOGIN'
        //     }])
        // if(isReady(user))
        //     inline_keyboard.push(this.getJoinButton());
        // if(allowLogout(user))
        //     inline_keyboard.push([{
        //         text: i18n.__('menu.logout'),
        //         callback_data: 'LOGOUT'
        //     }]);

        const inline_keyboard = this.getInlineKeyboards(user);

        if(inline_keyboard.length != 0){
            await botApi.callMethodAsync('sendMessage',{
                chat_id: user.telegram_user_id,
                text: i18n.__('get_started.help', user),
                reply_markup: { inline_keyboard: inline_keyboard }
            });
        }
        else{
            await botApi.sendTextMessageAsync(user.telegram_user_id, i18n.__('get_started.cant_help'));
        }
    },

    /**
     * 
     * @param {number} telegram_user_id 
     * 
     * Send any fallback error to user
     */
    async sendAnyFallbackAsync(telegram_user_id){
        await botApi.sendTextMessageAsync(telegram_user_id, i18n.__('fallback.any'));
    },

    /**
     * @param {number} telegram_user_id
     * @param {string} path
     */
    sendUnexpectedError(telegram_user_id, path){
        botApi.sendTextMessageAsync(config.adminChatID, `Unexpected workflow path at ${path}`);
        if(telegram_user_id)  
            botApi.sendTextMessageAsync(telegram_user_id, i18n.__('fallback.unexpected'));
    },

    /**
     * 
     * @param {number} telegram_user_id
     * @param {string} path
     * @param {Payload} payload
     * 
     * Send any server error to user and admin group
     */
    sendServerErrorAsync(telegram_user_id, path, payload){
        botApi.sendTextMessageAsync(config.adminChatID, JSON.stringify({
            message: `error occured at ${path}`,
            user_id: telegram_user_id,
            paylaod: payload
        }));
        if(telegram_user_id)
            botApi.sendTextMessageAsync(telegram_user_id, i18n.__('fallback.server_error'));
    },

    /**
     * 
     * @param {User} user
     * @returns {Array<Array>}
     */
    getInlineKeyboards(user){
        const inline_keyboard = [];
        if(allowChangeLanguage(user))
            inline_keyboard.push(this.getLanguageButton());
        if(allowRegister(user))
            inline_keyboard.push(this.getRegisterButton());
        if(allowInvite(user))
            inline_keyboard.push(this.getInviteButton());
        if(allowLogin(user))
            inline_keyboard.push(this.getLoginButton());
        if(isReady(user))
            inline_keyboard.push(this.getJoinButton());
        if(allowLogout(user))
            inline_keyboard.push(this.getLogoutButton());
        if(allowChangePin(user))
            inline_keyboard.push(this.getPinButton());
        return inline_keyboard;
    },

    /**
     * 
     * @returns {Array}
     */
    getLanguageButton(){
        return [{
            text: i18n.__('menu.language'),
            callback_data: 'LANGUAGE'
        }];
    },

    /**
     * 
     * @returns {Array}
     */
    getRegisterButton(){
        return [{
            text: i18n.__('menu.register'),
            callback_data: 'REGISTER'
        }];
    },

    /**
     * 
     * @returns {Array}
     */
    getInviteButton(){
        return [{
            text: i18n.__('menu.invite'),
            callback_data: 'INVITE'
        }];
    },

    /**
     * 
     * @returns {Array}
     */
    getLoginButton(){
        return [{
            text: i18n.__('menu.login'),
            callback_data: 'LOGIN'
        }];
    },

    /**
     * 
     * @returns {Array}
     */
    getLogoutButton(){
        return [{
            text: i18n.__('menu.logout'),
            callback_data: 'LOGOUT'
        }];
    },

    /**
     * 
     * @returns {Array}
     */
    getPinButton(){
        return [{
            text: i18n.__('menu.pin'),
            callback_data: 'PIN'
        }]
    },

    /**
     * 
     * @returns {Array}
     */
    getJoinButton(){
        return [{
            text: i18n.__('menu.join'),
            url: config.mainChatUrl
        }];
    }
}