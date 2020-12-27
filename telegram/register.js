'use strict';

const
    i18n = require('../i18n.config');
const
    inviteDb = require('../database/invite'),
    userDb = require('../database/user');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { READY } = require('../types/userstatus');
const
    crypto = require('../security/crypto_util'),
    cryptoConfig = require('../security/config');
const
    botApi = require('./botApi'),
    help = require('./help'),
    { allowRegister } = require('./check');

module.exports = class Register{
    static type = 'REGISTER';

    /**
     * 
     * @param {User} user 
     * @param webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(Register.type);
    }

    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;

        switch(data){
            case Register.type:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.register'));
                if(allowRegister(this.user)){
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.ask_code'));
                    this.payload.step = 'ASK_CODE';
                }
                else{
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.not_allowed'));
                    this.payload.complete();
                    await help.sendHelpAsync(this.user);
                }
                break;
            default:
                this.payload.complete();
                await help.sendUnexpectedError(this.user.telegram_user_id, 'register.handleCallbackQueryAsync');
                await help.sendHelpAsync(this.user);
                break;
        }
    }

    async handleNewPrivateMessageAsync(){
        const chat_id = this.webhookEvent.message.chat.id;
        const message_id = this.webhookEvent.message.message_id;
        const text = this.webhookEvent.message.text;

        switch(this.payload.step){
            case 'ASK_CODE':
                const code = text;

                const invite_id = await inviteDb.checkInviteAsync(code);
                if(invite_id){ // If code is valid
                    this.user.invite_id = invite_id;
                    // Ask Pin
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.ask_pin'));
                    this.payload.step = 'ASK_PIN';
                }
                else{
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.invalid_code'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.ask_code'));
                }
                break;
            case 'ASK_PIN':
                const pin = this.replaceNumber(text);
                await botApi.deleteMessageAsync(chat_id, message_id);
                if(this.checkPin(pin)){
                    // use Invite
                    const invite = await inviteDb.useInviteAsync(this.user.invite_id); // Use invite code

                    botApi.unbanChatMember(this.user.telegram_user_id);
                    // Encode Pin with Pin itself and update database
                    const key = crypto.getKeyFromPassword(pin, cryptoConfig.pinSalt);
                    this.user.pin = crypto.encrypt(pin, key).toString('base64');
                    this.user.status = READY;
                    this.user.is_ground = invite.is_ground;
                    await userDb.addUserAsync(this.user);

                    // send completed message
                    await botApi.callMethodAsync('sendMessage', {
                        chat_id: chat_id,
                        text: i18n.__('register.completed'),
                        parse_mode: 'MarkdownV2',
                        reply_markup: { inline_keyboard: [ help.getJoinButton() ]}
                    });
                    this.payload.complete();
                }
                else{
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.invalid_pin'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.ask_pin'));
                }
                break;
            default:
                this.payload.complete();
                await help.sendUnexpectedError(this.user.telegram_user_id, 'register.handleNewPrivateMessageAsync');
                await help.sendHelpAsync(this.user);
                break;
        }
    }

    checkPin(text){
        const pin = text.trim();
        if(pin.length < 6 || pin.length > 10) return false;
        const parsedPin = parseInt(pin);
        if(isNaN(parsedPin)) return false;
        else return true;
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