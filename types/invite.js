module.exports = class Invite{
    /** @type {number} */
    invite_id = null;

    /** @type {number} */
    telegram_user_id = null;

    /** @type {string | Date} */
    date_generated = null;

    /** @type {string} */
    code = null;

    /** @type {boolean} */
    is_used = false;

    /** @type {boolean} */
    is_ground = true;

    constructor(invite){
        this.invite_id = (invite.invite_id) ? invite.invite_id : null;
        this.telegram_user_id = (invite.telegram_user_id) ? invite.telegram_user_id : null;
        this.date_generated = (invite.date_generated) ? invite.date_generated : null;
        this.code = (invite.code) ? invite.code : null;
        this.is_used = (invite.is_used) ? invite.is_used : null;
        this.is_ground = (invite.is_ground) ? invite.is_ground : null;
    }
}