const i18n = require('../i18n.config');
const
    userDb = require('../database/user'),
    logDb = require('../database/logging');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { STANDBY } = require('../types/userstatus'),
    { UNBAN } = require('../types/logactivity');
const
    config = require('./config');
const help = require('./help');
const botApi = require('./botApi');


module.exports = class Unban{
    static type = 'UNBAN';

    /**
     * 
     * @param {User} user 
     * @param webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(Unban.type);
    }

    /**
     * 
     * @param {string} data 
     */
    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;
        const from = this.webhookEvent.callback_query.from;
        if(chat_id != config.adminChatID) return;

        if(data.startsWith('UNBAN_')){
            const telegram_user_id = Number(data.substring(6));
            //await botApi.unbanChatMember(telegram_user_id);
            await logDb.addLogAsync(telegram_user_id, UNBAN, from.id)
            await userDb.updateStatusAsync(telegram_user_id, STANDBY);
            await botApi.removeReplyMarkupAsync(this.webhookEvent);
            const fromUser = new User(from);
            botApi.sendMarkdownV2TextMessageAsync(telegram_user_id, i18n.__('unban.inform_user', fromUser));
        }
        else{
            help.sendUnexpectedError(null, 'unban.handleCallbackQueryAsync');
        }
        this.payload.complete();
    }
}