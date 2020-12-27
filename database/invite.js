const
    query = require('./query'),
    config = require('../security/config'),
    crypto = require('../security/crypto_util'),
    Invite = require('../types/invite');

module.exports = {
    /**
     * 
     * @param {number} inviter_user_id - inviter telegram user id
     * @param {boolean} is_ground = whether is it ground person
     * @returns - Return invite object if added successfully
     * 
     * Add Invite to database
     */
    async addInviteAsync(inviter_user_id, is_ground=true){
        const invite = {
            inviter_user_id : inviter_user_id,
            date_generated : new Date().toISOString(),
            is_used : false,
            is_ground: is_ground
        };
        const str = query.getInsertFieldString(invite, [
            'inviter_user_id',
            'date_generated',
            'is_used',
            'is_ground'
        ]);
        let sql = `INSERT INTO invites ${str} RETURNING invite_id;`;
        let result = await query.executeQueryAsync(sql);
        const invite_id = result.rows[0].invite_id;
        console.log(`invite_id: ${invite_id}`);
        const code = crypto.encrypt(''+invite_id, config.inviteKey).toString('base64');
        console.log(`code: ${code}`);
        // const code = query.encrypt(config.cryptoInviteKey, ''+invite_id);
        sql = `UPDATE invites SET code='${code}' WHERE invite_id=${invite_id} RETURNING *;`;
        result = await query.executeQueryAsync(sql);
        return new Invite(query.getObject(result));
    },

    /**
     * 
     * @param {string} code - invite code
     * @returns - return invite_id if successful, otherwise null
     * 
     * Check invite code match and return invite_id if successful
     * 
     */
    async checkInviteAsync(code){
        try {
            const invite_id = crypto.decrypt(Buffer.from(code, 'base64'), config.inviteKey);
            const sql = `SELECT code,is_used FROM invites WHERE invite_id=${invite_id};`;
            const result = await query.executeQueryAsync(sql);
            if(result.rows[0].code == code && !result.rows[0].is_used)
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
     * @returns {Invite}
     * 
     * Use Invite and update to database
     */
    async useInviteAsync(invite_id){
        const sql = `UPDATE invites SET is_used=true WHERE invite_id=${invite_id} RETURNING *;`;
        return await query.executeQueryAsync(sql);
    }
}