'use strict';

const
    i18n = require('../i18n.config');
const
    inviteDb = require('../database/invite'),
    logDb = require('../database/logging');
const
    User = require('../types/user'),
    Payload = require('../types/payload'),
    { TRYINVITE } = require('../types/logactivity');
const
    botApi = require("./botApi"),
    help = require('./help'),
    { allowInvite } = require('./check');

module.exports = class Invite{
    static type = 'INVITE';

    /**
     * 
     * @param {User} user 
     * @param webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(Invite.type);
    }

    /**
     * 
     * @param {string} data 
     */
    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;

        this.payload.complete();

        switch(data){
            case Invite.type:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.invite'));

                if(!(await this.isAllowAsync())) return;

                // Ask whether is gound or not
                await botApi.callMethodAsync('sendMessage', {
                    chat_id: chat_id,
                    text: i18n.__('invite.ask_ground'),
                    reply_markup: { inline_keyboard: [[{
                        text: i18n.__('menu.ground'),
                        callback_data: `${Invite.type}_GROUND`
                    }],
                    [{
                        text: i18n.__('menu.not_ground'),
                        callback_data: `${Invite.type}_NOT_GROUND`
                    }]]}});
                break;
            case `${Invite.type}_GROUND`:
            case `${Invite.type}_NOT_GROUND`:
                const menu = (data==`${Invite.type}_GROUND`) ? 'menu.ground' : 'menu.not_ground';
                const isground = (data==`${Invite.type}_GROUND`) ? true : false;
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__(menu));
                
                if(!(await this.isAllowAsync())) return;

                const invite = await inviteDb.addInviteAsync(this.user.telegram_user_id, isground);
                const botUser = new User(await botApi.getMeAsync());
                await botApi.sendTextMessageAsync(chat_id, i18n.__('invite.pre_instruction'));
                await botApi.sendMarkdownV2TextMessageAsync(chat_id, i18n.__('invite.instruction', botUser));
                await botApi.sendTextMessageAsync(chat_id, invite.code);
                await help.sendHelpAsync(this.user);
                break;
            default:
                help.sendUnexpectedError(this.user.telegram_user_id, 'invite.handleCallbackQueryAsync');
                break;
        }
    }

    async isAllowAsync(){
        if(!allowInvite(this.user)){
            await logDb.addLogAsync(this.user.telegram_user_id, TRYINVITE);
            await botApi.sendTextMessageAsync(chat_id, i18n.__('invite.not_allowed'));
            await help.sendHelpAsync(this.user);
            return false;
        }
        else return true;
    }
}