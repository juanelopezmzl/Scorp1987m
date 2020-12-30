'use strict';

const
    i18n = require('../i18n.config'),
    { replaceNumber } = require('../helper');
const
    inviteDb = require('../database/invite'),
    userDb = require('../database/user'),
    logDb = require('../database/logging');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { READY } = require('../types/userstatus'),
    { TRYREGISTER } = require('../types/logactivity');
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

                if(!allowRegister(this.user)){
                    this.payload.complete();
                    await logDb.addLogAsync(this.user.telegram_user_id, TRYREGISTER);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.not_allowed'));
                    await help.sendHelpAsync(this.user);
                    return;
                }

                await botApi.sendTextMessageAsync(chat_id, i18n.__('register.ask_code'));
                this.payload.step = 'ASK_CODE';
                break;
            default:
                this.payload.complete();
                help.sendUnexpectedError(this.user.telegram_user_id, 'register.handleCallbackQueryAsync');
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
                if(!allowRegister(this.user)){
                    this.payload.complete();
                    await logDb.addLogAsync(this.user.telegram_user_id, TRYREGISTER);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.not_allowed'));
                    await help.sendHelpAsync(this.user);
                    return;
                }

                const code = text;
                const invite_id = await inviteDb.checkInviteAsync(code, this.user.telegram_user_id);
                if(invite_id){ // If code is valid
                    this.payload.invite_id = invite_id;
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
                const pin = replaceNumber(text);
                await botApi.deleteMessageAsync(chat_id, message_id);

                if(!allowRegister(this.user)){
                    this.payload.complete();
                    await logDb.addLogAsync(this.user.telegram_user_id, TRYREGISTER);
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.not_allowed'));
                    await help.sendHelpAsync(this.user);
                    return;
                }

                if(this.checkPin(pin)){
                    this.payload.complete();
                    // use Invite
                    const invite = await inviteDb.useInviteAsync(this.payload.invite_id); // Use invite code
                    if(invite){
                        // Encode Pin with Pin itself and update database
                        const key = crypto.getKeyFromPassword(pin, cryptoConfig.pinSalt);
                        this.user.pin = crypto.encrypt(pin, key).toString('base64');
                        this.user.inviter_telegram_user_id = invite.telegram_user_id;
                        this.user.invite_code_generated_date = invite.date_generated;
                        this.user.is_ground = invite.is_ground;
                        const userFromDb = await userDb.getUserByIdAsync(this.user.telegram_user_id);
                        if(userFromDb)
                            await userDb.updateUserAsync(this.user);
                        else{
                            this.user.status = READY;
                            await userDb.addUserAsync(this.user);
                        }
                        await botApi.unbanChatMember(this.user.telegram_user_id);
    
                        // send completed message
                        await botApi.callMethodAsync('sendMessage', {
                            chat_id: chat_id,
                            text: i18n.__('register.completed'),
                            parse_mode: 'MarkdownV2',
                            reply_markup: { inline_keyboard: [ help.getJoinButton() ]}
                        });
                    }
                }
                else{
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.invalid_pin'));
                    await botApi.sendTextMessageAsync(chat_id, i18n.__('register.ask_pin'));
                }
                break;
            default:
                this.payload.complete();
                help.sendUnexpectedError(this.user.telegram_user_id, 'register.handleNewPrivateMessageAsync');
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
}