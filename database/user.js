const { READY, INGROUP, INACTIVE } = require('../types/userstatus');
const
    query = require('./query'),
    User = require('../types/user');

module.exports = {

    /**
     * 
     * @returns {Promise<Array<User>>}
     * 
     * Get all users
     */
    async getUserAsync(){
        const sql = `SELECT u.telegram_name,u.telegram_user_name,u.language,i.telegram_name AS inviter_telegram_name,i.telegram_user_name AS inviter_user_name,iv.date_generated AS invite_code_generated_date,u.registered_date,u.status,u.is_ground FROM users u LEFT JOIN invites iv ON u.invite_id=iv.invite_id LEFT JOIN users i ON iv.inviter_user_id=i.telegram_user_id;`;
        const result = await query.executeQueryAsync(sql);
        return query.getArray(result);
    },

    /**
     * @returns {Promise<Array<User>>}
     * 
     * Get users that are not ban
     */
    async getNotBanUsersAsync(){
        const sql = `SELECT * FROM users WHERE status<>'${INACTIVE}';`;
        const result = await query.executeQueryAsync(sql);
        return query.getArray(result);
    },

    /**
     * 
     * @returns {Promise<Array<User>>}
     * 
     * Get users that require to check in
     */
    async getCheckInUsersAsync(){
        const sql = `SELECT * FROM users WHERE status IN('${READY}'','${INGROUP}') AND is_ground=true;`
        const result = await query.executeQueryAsync(sql);
        return query.getArray(result);
    },

    /**
     * 
     * @param {Number} telegram_user_id - Telegram User ID
     * @returns {Promise<User>} - Return user if found, otherwise null
     * 
     * Get User from database using Telegram User ID
     */
    async getUserByIdAsync(telegram_user_id){
        const sql = `SELECT * FROM users WHERE telegram_user_id=${telegram_user_id};`;
        const result = await query.executeQueryAsync(sql);
        const obj = query.getObject(result);
        return (obj) ? new User(obj) : null;
    },

    /**
     * 
     * @param {User} user - User object to add
     * @returns {Promise<User>} - Return user if added successfully
     * 
     * Add User to database
     */
    async addUserAsync(user){
        user.registered_date = new Date().toISOString();
        const str = query.getInsertFieldString(user, [
            'telegram_user_id',
            'telegram_name',
            'telegram_user_name',
            'language',
            'pin',
            'invite_id',
            'registered_date',
            'status',
            'is_ground'
        ]);

        const sql = `INSERT INTO users ${str} RETURNING *;`;
        const result = await query.executeQueryAsync(sql);
        const obj = query.getObject(result);
        return (obj) ? new User(obj) : null;
    },

    /**
     * 
     * @param {User} user - User object to update
     * @returns {Promise<User>} - Return user if updated successfully
     * 
     * Update User to database
     */
    async updateUserAsync(user){
        const str = query.getUpdateValueString(user, [
            'status',
            'language'
        ])

        const sql = `UPDATE users SET ${str} WHERE telegram_user_id=${user.telegram_user_id} RETURNING *;`;
        console.log(sql);
        const result = await query.executeQueryAsync(sql);
        const obj = query.getObject(result);
        return (obj) ? new User(obj) : null;
    },

    /** 
     * @param {number} telegram_user_id
     * @param {string} status
     * @return
     * 
     */
    async updateStatusAsync(telegram_user_id, status){
        return await this.updateUserAsync({
            telegram_user_id: telegram_user_id,
            status: status
        });
    },

    /**
     * 
     * @param {number} telegram_user_id 
     * @param {string} language 
     * @returns 
     */
    async updateLanguageAsync(telegram_user_id, language){
        return await this.updateUserAsync({
            telegram_user_id: telegram_user_id,
            language: language
        });
    }
}