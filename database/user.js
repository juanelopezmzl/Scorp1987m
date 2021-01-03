const
    query = require('./query'),
    User = require('../types/user'),
    { READY, INGROUP, INACTIVE } = require('../types/userstatus'),
    { CHECKIN, LOGIN } = require('../types/logactivity');

module.exports = {
    /**
     * 
     * 
     * Get all users
     */
    async getUsersAsync(){
        const sql = `SELECT u.telegram_user_id,u.telegram_name,u.telegram_user_name,u.language,i.telegram_name AS inviter_telegram_name,i.telegram_user_name AS inviter_user_name,u.invite_code_generated_date,u.registered_date,u.status,u.is_ground FROM users u LEFT JOIN users i ON u.inviter_telegram_user_id=i.telegram_user_id;`;
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
    async getRequireCheckInUsersAsync(){
        const sql = `SELECT * FROM users WHERE status IN('${READY}','${INGROUP}') AND is_ground=true AND pin IS NOT NULL;`
        const result = await query.executeQueryAsync(sql);
        return query.getArray(result);
    },

    /**
     * 
     * @param {number} previousHours
     * @returns {Promise<Array<User>>}
     */
    async getRequireLogoutUsersAsync(previousHours){
        const sql = `SELECT u.* FROM users u JOIN (SELECT u.telegram_user_id, (SELECT t.logging_date FROM trackings t WHERE t.telegram_user_id=u.telegram_user_id AND t.logging_date >= NOW()-INTERVAL '${previousHours} hours' AND t.activity IN ('${CHECKIN}','${LOGIN}') ORDER BY t.logging_date DESC LIMIT 1) FROM users u WHERE u.is_ground = TRUE AND u.status IN('${READY}','${INGROUP}')) f ON u.telegram_user_id=f.telegram_user_id WHERE logging_date IS NULL;`;
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
        return query.getObject(result);
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
            'inviter_telegram_user_id',
            'invite_code_generated_date',
            'registered_date',
            'status',
            'is_ground'
        ]);

        const sql = `INSERT INTO users ${str} RETURNING *;`;
        const result = await query.executeQueryAsync(sql);
        return query.getObject(result);
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
            'language',
            'pin',
            'inviter_telegram_user_id',
            'invite_code_generated_date',
            'is_ground',
            'telegram_name',
            'telegram_user_name'
        ])

        const sql = `UPDATE users SET ${str} WHERE telegram_user_id=${user.telegram_user_id} RETURNING *;`;
        console.log(sql);
        const result = await query.executeQueryAsync(sql);
        return query.getObject(result);
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
    },

    /**
     * 
     * @param {number} telegram_user_id 
     * @param {string} pin 
     * @returns 
     */
    async updatePinAsync(telegram_user_id, pin){
        return await this.updateUserAsync({
            telegram_user_id: telegram_user_id,
            pin: pin
        });
    }
}