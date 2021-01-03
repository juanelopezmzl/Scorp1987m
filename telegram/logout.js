'use strict'

const i18n = require('../i18n.config');
const
    User = require('../types/user'),
    Payload = require('../types/payload');
const
    botApi = require("./botApi"),
    help = require("./help"),
    { allowLogout } = require('./check');

module.exports = class Logout{
    static type = 'LOGOUT';

    /**
     * 
     * @param {User} user 
     * @param webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(Logout.type);
    }

    /**
     * 
     * @param {string} data 
     */
    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;

        this.payload.complete();

        switch(data){
            case Logout.type:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.logout'));
                
                if(!allowLogout(this.user)){
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('logout.not_allowed'));
                    await help.sendHelpAsync(this.user);
                }

                await botApi.banChatMember(this.user.telegram_user_id);
                break;
            default:
                await help.sendUnexpectedError(this.user.telegram_user_id, 'logout.handleCallbackQueryAsync');
                await help.sendHelpAsync(this.user);
                break;
        }
    }
}