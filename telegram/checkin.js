const
    i18n = require('../i18n.config'),
    { replaceNumber } = require('../helper');
const
    logDb = require('../database/logging');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { READY } = require('../types/userstatus'),
    { TRYCHECKIN, CHECKIN } = require('../types/logactivity');
const
    crypto = require('../security/crypto_util'),
    cryptoConfig = require('../security/config');
const
    botApi = require('./botApi'),
    help = require('./help'),
    { allowCheckin } = require('./check');

module.exports = class CheckIn{
    static type = 'CHECKIN';

    /**
     * @param {User} user
     */
    static async sendCheckInMessageAsync(user){
        i18n.setLocale(user.language);
        return await botApi.callMethodAsync('sendMessage',{
            chat_id: user.telegram_user_id,
            text: i18n.__('checkin.prompt', user),
            reply_markup: {inline_keyboard:[[{
                text: i18n.__('menu.checkin'),
                callback_data: CheckIn.type
            }]]}
        });
    }
    
    /**
     * 
     * @param {User} user 
     * @param webhookEvent 
     * @param {Payload} payload 
     */
     constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(CheckIn.type);
    }

    /**
     * 
     * @param {string} data 
     */
    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;

        switch(data){
            case CheckIn.type:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.checkin'));

                if(!(await this.isAllowAsync())) return;

                await botApi.sendTextMessageAsync(chat_id, i18n.__('checkin.ask_pin'));
                this.payload.step = 'ASK_PIN';
                break;
            default:
                this.payload.complete();
                await help.sendUnexpectedError(this.user.telegram_user_id, 'checkin.handleCallbackQueryAsync');
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
                const pin = replaceNumber(text);
                await botApi.deleteMessageAsync(chat_id, message_id);
                                
                if(!(await this.isAllowAsync())) return;

                if(crypto.checkPassword(Buffer.from(this.user.pin, 'base64'), pin, cryptoConfig.pinSalt)){
                    this.payload.complete();
                    await logDb.addLogAsync(this.user.telegram_user_id, CHECKIN);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('checkin.completed'));
                }
                else{
                    await logDb.addLogAsync(this.user.telegram_user_id, TRYCHECKIN);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('checkin.invalid_pin'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('checkin.ask_pin'));
                }
                break;
            default:
                this.payload.complete();
                await help.sendUnexpectedError(this.user.telegram_user_id, 'login.handleNewPrivateMessageAsync');
                await help.sendHelpAsync(this.user);
                break;
        }
    }

    async isAllowAsync(){
        if(!allowCheckin(this.user)){
            this.payload.complete();
            await botApi.sendTextMessageAsync(chat_id, i18n.__('checkin.not_allowed'));
            await help.sendHelpAsync(this.user);
            return false;
        }
        else return true;
    }
}