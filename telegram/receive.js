'use strict';

const
    i18n = require('../i18n.config');
const
    userDb = require('../database/user'),
    logDb = require('../database/logging');
const
    User = require('../types/user'),
    Progress = require('../types/progress'),
    { INGROUP, STANDBY, INACTIVE, READY } = require('../types/userstatus'),
    { TRYJOIN, LOGIN, ADDED, LEFT, LOGOUT, BAN } = require('../types/logactivity');
const
    config = require('./config'),
    botApi = require('./botApi'),
    help = require('./help'),
    Language = require('./language'),
    Invite = require('./invite'),
    Register = require('./register'),
    Login = require('./login'),
    Logout = require('./logout'),
    Unban = require('./unban'),
    { isReady, allowLogout } = require('./check');

    /**
     * 
     * @param member 
     * @param {string} status 
     * @returns 
     */
    const addUpdateUserStatusAsync = async function(member, status){
        let user = await userDb.getUserByIdAsync(member.id);
        if(user)
            return await userDb.updateStatusAsync(member.id, status);
        else{
            const user = new User(member);
            user.status = status;
            return await userDb.addUserAsync(user);
        }
    }

/** @type {User} */
let botUser = null;

const WorkFlows = [Language, Invite, Register, Login, Logout, Unban];

const inprogress = {};

module.exports = {
    setBotUser(bot){
        botUser = new User(bot);
    },


    /**
     * 
     * @param from - from object from telegram bot update
     * @returns {Progress} - Progress object
     */
    async getUserAndPayloadAsync(from){
        if(from.id in inprogress){
            return inprogress[from.id];
        }
        else{
            let user = await userDb.getUserByIdAsync(from.id);
            if(!user)
                user = new User(from);
            return new Progress(user);
        }
    },


    /**
     * 
     * @param webhookEvent 
     * 
     */
    async handleNewPrivateMessageAsync(webhookEvent) {
        const from = webhookEvent.message.from;
        if(from.is_bot) return;
        const chat_id = webhookEvent.message.chat.id;
        const text = webhookEvent.message.text;
        
        // set user and locale
        const { user, payload } = await this.getUserAndPayloadAsync(from);
        i18n.setLocale(user.language);

        try {
            if(text){
                const lowerText = text.toLowerCase();
                if(lowerText.startsWith('/start')){
                    delete inprogress[chat_id];
                    await help.sendWelcomeAsync(user);
                    await help.sendInitialAsync(user.telegram_user_id);
                    await help.sendHelpAsync(user);
                    return;
                }
            }

            if(chat_id in inprogress){
                let isFound = false;
                for(let i=0; i<WorkFlows.length; i++){
                    const Workflow = WorkFlows[i];
                    if(payload.type == Workflow.type){
                        isFound = true;
                        const workflow = new Workflow(user, webhookEvent, payload);
                        await workflow.handleNewPrivateMessageAsync();
                        if(payload.isCompleted)
                            delete inprogress[chat_id];
                        break;
                    }
                }
                if(!isFound){
                    delete inprogress[chat_id];
                    help.sendUnexpectedError(user.telegram_user_id, 'receive.handleNewPrivateMessageAsync');
                    await help.sendHelpAsync(user);
                }
            }
            else{
                await help.sendAnyFallbackAsync(user.telegram_user_id);
                await help.sendHelpAsync(user);
            }
        }
        catch (ex){
            console.error(ex);
            await help.sendServerErrorAsync(user.telegram_user_id, 'receive.handleNewPrivateMessageAsync', payload);
            await help.sendHelpAsync(user);
        }
    },


    /**
     * 
     * @param webhookEvent 
     */
    async handleNewAdminMessageAsync(webhookEvent){
        const from = webhookEvent.message.from;
        if(from.is_bot) return;
        const chat_id = webhookEvent.message.chat.id;
        if(chat_id!=config.adminChatID) return;
        const text = webhookEvent.message.text;

        try{
            if(text){
                const lowerText = text.toLowerCase();
                const msg = (git+'').substring(4).trim();
                if(lowerText.startsWith('/msg')){
                    const users = await userDb.getNotBanUsersAsync();
                    let sentCount=0;
                    let notSent = '';
                    for(let i=0; i<users.length; i++){
                            const result = await botApi.sendTextMessageAsync(users[i].telegram_user_id, msg);
                            if(result)
                                sentCount++;
                            else
                                notSent += `\n${users[i].telegram_name}`;
                            
                    }
                    const replyMsg = `Total Sent: ${sentCount}\nI can't sent to the following:\n${notSent.substring(1)}`;
                    await botApi.sendTextMessageAsync(chat_id, replyMsg);
                }
            }
        }
        catch(ex){
            console.error(ex);
            await help.sendServerErrorAsync(from.id, 'receive.handleNewAdminMessageAsync');
        }
    },


    async handleCallbackQueryAsync(webhookEvent){
        const from = webhookEvent.callback_query.from
        if(from.is_bot) return;
        const chat_id = webhookEvent.callback_query.message.chat.id;
        const data = webhookEvent.callback_query.data;

        // set user and locale
        let { user, payload } = await this.getUserAndPayloadAsync(from);
        i18n.setLocale(user.language);

        try{
            let isFound = false;
            for(let i =0; i < WorkFlows.length; i++){
                const Workflow = WorkFlows[i];
                if(data.startsWith(Workflow.type)){
                    isFound = true;
                    const workflow = new Workflow(user, webhookEvent, payload);
                    await workflow.handleCallbackQueryAsync(data);
                    if(!payload){
                        payload = workflow.payload;
                        inprogress[chat_id] = new Progress(user, payload);
                    }
                    if(payload.isCompleted){
                        delete inprogress[chat_id];
                    }
                    break;
                }
            }
            if(!isFound){
                delete inprogress[chat_id];
                help.sendUnexpectedError(user.telegram_user_id, 'receive.handleCallbackQueryAsync');
                await help.sendHelpAsync(user);
            }
        }
        catch(ex){
            console.error(ex);
            await help.sendServerErrorAsync(user.telegram_user_id, 'receive.handleCallbackQueryAsync', payload);
            await help.sendHelpAsync(user);
        }
    },


    async handleChatMemeberAsync(webhookEvent){
        try{
            const chat_id = webhookEvent.chat.id;
            if(chat_id != config.mainChatID) return;
    
            // When user join the group
            if(webhookEvent.new_chat_members){
                const from_id = webhookEvent.from.id;
                for(let i=0; i< webhookEvent.new_chat_members.length; i++){
                    const member = webhookEvent.new_chat_members[i];
                    if(member.id == from_id){
                        const user = await userDb.getUserByIdAsync(member.id);
                        if(isReady(user)){
                            await logDb.addLogAsync(member.id, LOGIN);
                            user.status = INGROUP;
                            await userDb.updateStatusAsync(member.id, INGROUP);
                            await botApi.sendMarkdownV2TextMessageAsync(member.id, i18n.__('login.completed'));
                            await help.sendHelpAsync(user);
                        }
                        else{
                            await botApi.banChatMember(member.id);
                            await logDb.addLogAsync(member.id, TRYJOIN);
                        }
                    }
                    // If administrator is added personally. the person will not be able to Login back if left from group
                    else{
                        await logDb.addLogAsync(member.id, ADDED, from_id);
                        await addUpdateUserStatusAsync(new User(member), INGROUP);
                    }
                }
            }
            // When user left the group
            else if(webhookEvent.left_chat_member){
                const from_id = webhookEvent.from.id;
                const member = webhookEvent.left_chat_member;
                if(!(botUser)) botUser = new User(await botApi.getMeAsync());

                // left by him/herself
                if(from_id == member.id){
                    await botApi.banChatMember(member.id);
                    await logDb.addLogAsync(member.id, LEFT);
                    const user = await userDb.getUserByIdAsync(member.id);
                    if(user){
                        await userDb.updateStatusAsync(member.id, STANDBY);
                        help.sendHelpAsync(user);
                    }
                }
                // If bot removed user
                else if(from_id == botUser.telegram_user_id){
                    const user = await userDb.getUserByIdAsync(member.id);
                    if(allowLogout(user)){
                        await logDb.addLogAsync(member.id, LOGOUT);
                        await userDb.updateStatusAsync(member.id, STANDBY);
                        await botApi.sendTextMessageAsync(member.id, i18n.__('logout.completed'));
                        user.status = STANDBY;
                        await help.sendHelpAsync(user);
                    }
                }
                // If administrators kicked
                else{
                    logDb.addLogAsync(member.id, BAN, from_id);
                    const from_user = await userDb.getUserByIdAsync(from_id);
                    const user = await userDb.getUserByIdAsync(member.id);
                    const obj = {
                        from: from_user,
                        to: user
                    }
                    if(user){
                        await userDb.updateStatusAsync(member.id, INACTIVE);
                        botApi.sendMarkdownV2TextMessageAsync(member.id, i18n.__('ban.inform_user', obj));
                    }
                    await botApi.callMethodAsync('sendMessage', {
                        chat_id: config.adminChatID,
                        text: i18n.__('ban.inform_admin', obj),
                        parse_mode: 'MarkdownV2',
                        reply_markup: {
                            inline_keyboard: [[{
                                text: i18n.__('menu.unban', obj),
                                callback_data: `UNBAN_${user.telegram_user_id}`
                            }]]
                        }
                    });
                }
            }
        }
        catch(ex){
            console.error(ex);
            await help.sendServerErrorAsync(null, 'receive.handleChatMemeberAsync', null);
        }
    }
}