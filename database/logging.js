const query = require('./query');

module.exports = {
    /**
     * 
     * @param {number} limit 
     * @param {number} page 
     * @param {string} telegram_user_name 
     */
    async getLogAsync(limit = null, page = null, telegram_user_name = null){
        if(!limit) limit = 20;
        if(!page) page = 1;
        const where = (telegram_user_name) ? `WHERE LOWER(u.telegram_user_name)=LOWER('${telegram_user_name}')` : '';
        const sql = `SELECT l.logging_date,u.telegram_name,u.telegram_user_name,l.activity,b.telegram_name AS by_telegram_name,b.telegram_user_name AS by_telegram_user_name FROM trackings l LEFT JOIN users u ON l.telegram_user_id=u.telegram_user_id LEFT JOIN users b ON l.by_telegram_user_id=b.telegram_user_id ${where} ORDER BY l.logging_date DESC OFFSET ${limit * (page-1)} ROWS FETCH NEXT ${limit} ROWS ONLY;`;
        const result = await query.executeQueryAsync(sql);
        return query.getArray(result);
    },

    /**
     * 
     * @param {number} telegram_user_id - telegram user id of the user
     * @param {string} activity - activity name
     * @param {number} by_telegram_user_id - performed by telegram user id
     * 
     * Add log to database
     */
    async addLogAsync(telegram_user_id, activity, by_telegram_user_id = null){
        const log = {
            logging_date: new Date().toISOString(),
            telegram_user_id: telegram_user_id,
            activity: activity,
            by_telegram_user_id : by_telegram_user_id
        }

        const str = query.getInsertFieldString(log, [
            'logging_date',
            'telegram_user_id',
            'activity',
            'by_telegram_user_id'
        ]);

        const sql = `INSERT INTO trackings ${str};`;
        await query.executeQueryAsync(sql);
    }
}