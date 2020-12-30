const
    query = require('./query'),
    config = require('../security/config'),
    crypto = require('../security/crypto_util'),
    Invite = require('../types/invite');

module.exports = {
    /**
     * 
     * @param {number} telegram_user_id - inviter telegram user id
     * @param {boolean} is_ground = whether is it ground person
     * @returns {Promise<Invite>} - Return invite object if added successfully
     * 
     * Add Invite to database
     */
    async addInviteAsync(telegram_user_id, is_ground=false){
        const invite = {
            telegram_user_id : telegram_user_id,
            date_generated : new Date(),
            is_used : false,
            is_ground: is_ground
        };
        const str = query.getInsertFieldString(invite, [
            'telegram_user_id',
            'date_generated',
            'is_used',
            'is_ground'
        ]);
        let sql = `INSERT INTO invites ${str} RETURNING invite_id;`;
        let result = await query.executeQueryAsync(sql);
        const invite_id = result.rows[0].invite_id;
        // console.log(`invite_id: ${invite_id}`);
        const code = crypto.encrypt(''+invite_id, config.inviteKey).toString('base64');
        // console.log(`code: ${code}`);
        // const code = query.encrypt(config.cryptoInviteKey, ''+invite_id);
        sql = `UPDATE invites SET code='${code}' WHERE invite_id=${invite_id} RETURNING *;`;
        result = await query.executeQueryAsync(sql);
        return query.getObject(result);
    },

    /**
     * 
     * @param {string} code - invite code
     * @param {number} telegram_user_id
     * @returns - return invite_id if successful, otherwise null
     * 
     * Check invite code match and return invite_id if successful
     * 
     */
    async checkInviteAsync(code, telegram_user_id){
        try {
            const invite_id = crypto.decrypt(Buffer.from(code, 'base64'), config.inviteKey);
            const sql = `SELECT * FROM invites WHERE invite_id=${invite_id};`;
            const result = await query.executeQueryAsync(sql);
            const invite = query.getObject(result);
            if(invite.code == code && !invite.is_used && invite.telegram_user_id!=telegram_user_id)
                return parseInt(invite_id);
            else
                return null;
        }
        catch(ex){
            return null;
        }
    },

    /**
     * 
     * @param {number} invite_id - invite_id that is used
     * @returns {Promise<Invite>}
     * 
     * Use Invite and update to database
     */
    async useInviteAsync(invite_id){
        const sql = `UPDATE invites SET is_used=true WHERE invite_id=${invite_id} RETURNING *;`;
        const result = await query.executeQueryAsync(sql);
        return query.getObject(result);
    }
}