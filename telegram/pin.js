const
    i18n = require('../i18n.config'),
    { replaceNumber, checkPin } = require('../helper');
const
    userDb = require('../database/user'),
    inviteDb = require('../database/invite'),
    logDb = require('../database/logging');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { TRYCHANGEPIN, CHANGEDPIN } = require('../types/logactivity');
const
    crypto = require('../security/crypto_util'),
    cryptoConfig = require('../security/config');
const
    botApi = require('./botApi'),
    help = require('./help'),
    { allowChangePin } = require('./check');

module.exports = class Pin{
    static type = 'PIN';

    /**
 * 
 * @param {User} user 
 * @param webhookEvent 
 * @param {Payload} payload 
 */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(Pin.type);
    }

    /**
     * 
     * @param {string} data 
     */
    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;
        const message_id = this.webhookEvent.callback_query.message.message_id;

        if(!allowChangePin(this.user)){
            await botApi.callMethodAsync('answerCallbackQuery', {
                callback_query_id: this.webhookEvent.callback_query.id,
                text: i18n.__('pin.not_allowed'),
                show_alert: true
            });
            return;
        }

        switch(data){
            case Pin.type:
                this.payload.complete();
                await botApi.callMethodAsync('editMessageText',{
                    chat_id: chat_id,
                    message_id: message_id,
                    text: i18n.__('get_started.help', this.user),
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: i18n.__('menu.change_pin'),
                                callback_data: `${Pin.type}_CHANGE`
                            }],
                            [{
                                text: i18n.__('menu.forgot_pin'),
                                callback_data: `${Pin.type}_FORGOT`
                            }],
                            [{
                                text: i18n.__('menu.back_main'),
                                callback_data: `${Pin.type}_BACK`
                            }]
                        ]
                    }
                });
                break;
            case `${Pin.type}_BACK`:
                this.payload.complete();
                const inline_keyboard = help.getInlineKeyboards(this.user);
                if(inline_keyboard.length != 0)
                    await botApi.callMethodAsync('editMessageText', {
                        chat_id: chat_id,
                        message_id: message_id,
                        text: i18n.__('get_started.help', this.user),
                        reply_markup: { inline_keyboard: inline_keyboard }
                    });
                else
                    await botApi.callMethodAsync('editMessageText', {
                        chat_id: chat_id,
                        message_id: message_id,
                        text: i18n.__('get_started.cant_help'),
                        reply_markup: {}
                    });
                break;
            case `${Pin.type}_CHANGE`:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.change_pin'));
                await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.ask_current'));
                this.payload.step = 'ASK_CURRENT';
                break;
            case `${Pin.type}_FORGOT`:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.forgot_pin'));
                await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.ask_code'));
                this.payload.step = 'ASK_CODE';
                break;
            default:
                this.payload.complete();
                help.sendUnexpectedError(this.user.telegram_user_id, 'pin.handleCallbackQueryAsync');
                await help.sendHelpAsync(this.user);
        }
    }

    async handleNewPrivateMessageAsync(){
        const chat_id = this.webhookEvent.message.chat.id;
        const message_id = this.webhookEvent.message.message_id;
        const text = this.webhookEvent.message.text;
        let pin;

        switch(this.payload.step){
            case 'ASK_CURRENT':
                pin = replaceNumber(text);
                await botApi.deleteMessageAsync(chat_id, message_id);

                if(!(await this.isAllowAsync())) return;

                if(crypto.checkPassword(Buffer.from(this.user.pin, 'base64'), pin, cryptoConfig.pinSalt)){
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.ask_new'));
                    this.payload.step = 'ASK_NEW';
                }
                else{
                    await logDb.addLogAsync(this.user.telegram_user_id, TRYCHANGEPIN);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.invalid_current'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.ask_current'));
                }
                break;
            case 'ASK_CODE':
                const code = text;
                await botApi.deleteMessageAsync(chat_id, message_id);

                if(!(await this.isAllowAsync())) return;

                const invite_id = await inviteDb.checkInviteAsync(code, this.user.telegram_user_id);
                if(invite_id){ // If code is valid
                    this.payload.invite = await inviteDb.useInviteAsync(invite_id);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.ask_new'));
                    this.payload.step = 'ASK_NEW';
                }
                else{
                    await logDb.addLogAsync(this.user.telegram_user_id, TRYCHANGEPIN);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.invalid_code'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.ask_code'));
                }
                break;
            case 'ASK_NEW':
                pin = replaceNumber(text);
                await botApi.deleteMessageAsync(chat_id, message_id);

                if(!(await this.isAllowAsync())) return;

                if(checkPin(pin)){
                    this.payload.complete();
                    const key = crypto.getKeyFromPassword(pin, cryptoConfig.pinSalt);
                    this.user.pin = crypto.encrypt(pin, key).toString('base64');
                    if(this.payload.invite){
                        await logDb.addLogAsync(this.user.telegram_user_id, CHANGEDPIN, this.payload.invite.telegram_user_id);
                        await userDb.updateUserAsync({
                            telegram_user_id: this.user.telegram_user_id,
                            pin: this.user.pin,
                            is_ground: this.payload.is_ground
                        });
                    }
                    else{
                        await logDb.addLogAsync(this.user.telegram_user_id, CHANGEDPIN);
                        await userDb.updatePinAsync(this.user.telegram_user_id, this.user.pin);
                    }
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.completed'));
                    await help.sendHelpAsync(this.user);
                }
                else{
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.invalid_new'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('pin.ask_new'));
                }
                break;
            default:
                this.payload.complete();
                help.sendUnexpectedError(this.user.telegram_user_id, 'pin.handleNewPrivateMessageAsync');
                await help.sendHelpAsync(this.user);
        }
    }

    async isAllowAsync(){
        if(!allowChangePin(this.user)){
            this.payload.complete();
            await botApi.sendTextMessageAsync('pin.not_allowed');
            await help.sendHelpAsync(this.user);
            return false;
        }
        else return true;
    }
}