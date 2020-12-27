module.exports = class User{
    /** @type {number} */
    telegram_user_id = null;

    /** @type {string} */
    telegram_name = null;

    /** @type {string} */
    telegram_user_name = null;

    /** @type {string} */
    pin = null;

    /** @type {string} */
    language = 'my';

    /** @type {number} */
    invite_id = null;

    /** @type {string | Date} */
    registered_date = null;

    /** @type {string} */
    status = null;

    /** @type {boolean} */
    is_ground = false;

    /**
     * 
     * @param {User | any} item 
     */
    constructor(item){
        // If it is type of User
        if(item.telegram_user_id){
            this.telegram_user_id = item.telegram_user_id;
            this.telegram_name = item.telegram_name;
            this.telegram_user_name = item.telegram_user_name;
            this.pin = item.pin;
            this.language = (item.language) ? item.language : 'my';
            this.invite_id = item.invite_id;
            this.registered_date = item.registered_date;
            this.status = item.status;
            this.is_ground = item.is_ground;
        }
        else{
            this.telegram_user_id = item.id;
            const firstname = (item.firstName) ? item.firstName : (item.first_name) ? item.first_name : '';
            const lastname = (item.lastName) ? item.lastName : (item.last_name) ? item.last_name : '';
            this.telegram_name = (firstname + ' ' + lastname).trim();
            this.telegram_user_name = item.username;
        }
    }
}