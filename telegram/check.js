const
    User = require('../types/user'),
    { OWNER, INGROUP, STANDBY, READY } = require('../types/userstatus');

module.exports = {
    allowChangeLanguage(user){
        return (user) && (user.status)
    },

    /**
     * 
     * @param {User} user 
     * @returns
     */
    allowInvite(user){
        return (user) && (user.status == OWNER || user.status == INGROUP || user.status == STANDBY || user.status == READY);
    },

    /**
     * 
     * @param {User} user 
     * @returns 
     */
    allowRegister(user){
        return (user) && !(user.status);
    },

    /**
     * 
     * @param {User} user 
     * @returns 
     */
    allowLogin(user){
        return (user) && user.status == STANDBY && (user.pin)
    },

    /**
     * 
     * @param {User} user 
     * @returns 
     */
    isReady(user){
        return (user) && user.status == READY;
    },

    /**
     * 
     * @param {User} user 
     * @returns 
     */
    allowLogout(user){
        return (user) && user.status == INGROUP;
    },

    /**
     * 
     * @param {User} user 
     * @returns
     */
    allowCheckin(user){
        return (user) && (user.status==INGROUP || user.status==READY);
    }
}