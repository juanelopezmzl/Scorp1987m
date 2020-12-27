'use strict';

const
    config = require('./config'),
    fetch = require('node-fetch'),
    { URL } = require('url');

module.exports = {
    /**
     * 
     * @param {string} path - method name
     * @param body - body of the method
     * @returns - return reply
     * 
     * call telegram bot api method
     */
    async callMethodAsync(path, body = null){
        const urlStr = `${config.apiUrl}/${path}`;
        const url = new URL(urlStr);
        let json;
        if(body)
            json = JSON.stringify(body);
        else
            json = null;
        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: json
        });
        if(response.ok)
            return (await response.json()).result;
        else{
            console.error({
                status: response.status,
                statusText: response.statusText,
                url: urlStr,
                body: json,
                error: response.body
            });
            return null;
        }
    },

    /**
     * 
     * @returns Returns basic information about the bot in form of a User object
     */
    async getMeAsync(){
        return await this.callMethodAsync('getMe');
    },

    /**
     * 
     * @param {number} user_id 
     * @returns {Promise<boolean>}
     */
    async banChatMember(user_id){
        return await this.callMethodAsync('banChatMember',{
            chat_id: config.mainChatID,
            user_id: user_id,
            revoke_messages: true
        });
    },

    /**
     * @param {number} user_id
     * @returns {Promise<boolean>}
     */
    async unbanChatMember(user_id){
        return await this.callMethodAsync('unbanChatMember', {
            chat_id: config.mainChatID,
            user_id: user_id,
            only_if_banned: true
        });
    },

    /**
     * 
     * @param {number} chat_id - chat id to send text message
     * @param {string} text - text message
     * 
     * send Message to chat_id
     */
    async sendTextMessageAsync(chat_id, text){
        return await this.callMethodAsync('sendMessage', {
            chat_id: chat_id,
            text: text
        });
    },

    /**
     * 
     * @param {number} chat_id - chat id to send text message
     * @param {*} text - text message
     * 
     * send Message to chat_id with MarkdownV2
     */
    async sendMarkdownV2TextMessageAsync(chat_id, text){
        return await this.callMethodAsync('sendMessage', {
            chat_id: chat_id,
            text: text,
            parse_mode: 'MarkdownV2'
        })
    },

    /**
     * 
     * @param {number} chat_id - chat id to send text message
     * @param {string} file_id - file id to add as photo
     * @param {string} text - text message
     * 
     * send Photo to chat_id with MarkdownV2
     */
    async sendMarkdownV2Photo(chat_id, file_id, text){
        return await this.callMethodAsync('sendPhoto',{
            chat_id: chat_id,
            photo: file_id,
            caption: text,
            parse_mode: 'MarkdownV2'
        })
    },

    /**
     * 
     * @param {number} chat_id
     * @param {number} message_id 
     * 
     * delete message from chat_id and message_id
     */
    async deleteMessageAsync(chat_id, message_id){
        return await this.callMethodAsync('deleteMessage', {
            chat_id: chat_id,
            message_id, message_id
        });
    },

    /**
     * 
     * @param callbackEvent - callback event object
     * 
     * remove reply markup
     */
    async removeReplyMarkupAsync(callbackEvent){
        return await this.callMethodAsync('editMessageReplyMarkup', {
            chat_id: callbackEvent.callback_query.message.chat.id,
            message_id: callbackEvent.callback_query.message.message_id,
            reply_markkup: {}
        });
    },

    /**
     * 
     * @param callbackEvent - callback event object
     * @param {string} text - text to be updated
     * 
     * Remove replymarkup and update the text of the message
     */
    async editTextAndRemoveReplyMarkupAsync(callbackEvent, text){
        return await this.callMethodAsync('editMessageText', {
            chat_id: callbackEvent.callback_query.message.chat.id,
            message_id: callbackEvent.callback_query.message.message_id,
            text: text,
            reply_markkup: {}
        })
    }
}