'use strict';

const
    i18n = require('../i18n.config');
const
    userDb = require('../database/user'),
    logDb = require('../database/logging');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { STANDBY, READY } = require('../types/userstatus'),
    { TRYLOGIN } = require('../types/logactivity');
const
    crypto = require('../security/crypto_util'),
    cryptoConfig = require('../security/config');
const
    botApi = require('./botApi'),
    help = require('./help'),
    { allowLogin } = require('./check');
const config = require('./config');

module.exports = class Login{
    static type = 'LOGIN';

    /**
     * 
     * @param {User} user 
     * @param webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(Login.type);
    }

    /**
     * 
     * @param {string} data 
     */
    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;

        switch(data){
            case Login.type:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.login'));
                if(allowLogin(this.user)){
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('login.ask_pin'));
                    this.payload.step = 'ASK_PIN';
                }
                else{
                    this.payload.complete();
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('login.not_allowed'));
                    await help.sendHelpAsync(this.user);
                }
                break;
            default:
                this.payload.complete();
                await help.sendUnexpectedError(this.user.telegram_user_id, 'login.handleCallbackQueryAsync');
                await help.sendHelpAsync(this.user);
                break;
        }
    }

    async handleNewPrivateMessageAsync(){
        const chat_id = this.webhookEvent.message.chat.id;
        const message_id = this.webhookEvent.message.message_id;
        const text = this.webhookEvent.message.text;

        switch(this.payload.step){
            case 'ASK_PIN':
                const pin = this.replaceNumber(text);
                await botApi.deleteMessageAsync(chat_id, message_id);

                if(crypto.checkPassword(Buffer.from(this.user.pin, 'base64'), pin, cryptoConfig.pinSalt)){
                    await userDb.updateStatusAsync(this.user.telegram_user_id, READY);
                    await botApi.unbanChatMember(this.user.telegram_user_id);
                    await botApi.callMethodAsync('sendMessage', {
                        chat_id: this.user.telegram_user_id,
                        text: i18n.__('login.ready'),
                        parse_mode: 'MarkdownV2',
                        reply_markup: { inline_keyboard: [help.getJoinButton()]}
                    });
                    this.payload.complete();
                }
                else{
                    await logDb.addLogAsync(this.user.telegram_user_id, TRYLOGIN);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('login.invalid_pin'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('login.ask_pin'));
                }
                break;
            default:
                this.payload.complete();
                await help.sendUnexpectedError(this.user.telegram_user_id, 'login.handleNewPrivateMessageAsync');
                await help.sendHelpAsync(this.user);
                break;
        }
    }
    
    /**
     * 
     * @param {string} text 
     * @returns 
     */
     replaceNumber(text){
        if (!text) return null;
        return text
            .replace('၀', '0')
            .replace('၁', '1')
            .replace('၂', '2')
            .replace('၃', '3')
            .replace('၄', '4')
            .replace('၅', '5')
            .replace('၆', '6')
            .replace('၇', '7')
            .replace('၈', '8')
            .replace('၉', '9')
    }
}