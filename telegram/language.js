
const i18n = require('../i18n.config');
const userDb = require('../database/user');
const
    User = require('../types/user'),
    Payload = require('../types/payload');
const botApi = require("./botApi");
const help = require('./help');
const { allowChangeLanguage } = require('./check');

module.exports = class Language{
    static type = 'LANGUAGE';

    /**
     * 
     * @param {User} user 
     * @param webhookEvent 
     * @param {Payload} payload 
     */
    constructor(user, webhookEvent, payload = null){
        this.user = user;
        this.webhookEvent = webhookEvent;
        this.payload = (payload) ? payload : new Payload(Language.type);
    }

    async handleCallbackQueryAsync(data){
        const chat_id = this.webhookEvent.callback_query.message.chat.id;
        if(!allowChangeLanguage(this.user)){
            this.payload.complete();
            await botApi.sendTextMessageAsync(this.user.telegram_user_id, i18n.__('language.not_allowed'));
            await help.sendHelpAsync(this.user);
            return;
        }

        switch(data){
            case Language.type:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('menu.language'));
                await botApi.callMethodAsync('sendMessage', {
                    chat_id: chat_id,
                    text: i18n.__('language.prompt'),
                    reply_markup: { inline_keyboard: [[
                        {
                            text: i18n.__('language.english'),
                            callback_data: `${Language.type}_ENGLISH`
                        },
                        {
                            text: i18n.__('language.myanmar'),
                            callback_data: `${Language.type}_MYANMAR`
                        }
                    ]]}
                });
                this.payload.complete();
                break;
            case `${Language.type}_ENGLISH`:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('language.english'));
                await botApi.sendTextMessageAsync(chat_id, i18n.__('language.english_changed'));
                if(this.user.language != 'en'){
                    i18n.setLocale('en');
                    await userDb.updateLanguageAsync(this.user.telegram_user_id, 'en');
                }
                this.payload.complete();
                await help.sendHelpAsync(this.user);
                break;
            case `${Language.type}_MYANMAR`:
                await botApi.editTextAndRemoveReplyMarkupAsync(this.webhookEvent, i18n.__('language.myanmar'));
                await botApi.sendTextMessageAsync(chat_id, i18n.__('language.myanmar_changed'));
                if(this.user.language != 'my'){
                    i18n.setLocale('my');
                    await userDb.updateLanguageAsync(this.user.telegram_user_id, 'my');
                }
                this.payload.complete();
                await help.sendHelpAsync(this.user);
                break;
            default:
                this.payload.complete();
                await help.sendUnexpectedError(this.user.telegram_user_id, 'language.handleCallbackQueryAsync');
                await help.sendHelpAsync(this.user);
                break;
        }
    }
}