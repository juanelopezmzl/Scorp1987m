const
    User = require('../types/user'),
    { OWNER, INGROUP, STANDBY, READY, INACTIVE } = require('../types/userstatus');

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
        return (user) && (!user.status || (!user.pin && user.status!=OWNER && user.status!=INACTIVE ));
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
    },

    /**
     * 
     * @param {User} user 
     * @returns 
     */
    allowUnban(user){
        return (user) && (user.status==INACTIVE);
    },

    /**
     * 
     * @param {User} user 
     * @returns 
     */
    allowChangePin(user){
        return (user) && (user.pin) && (user.status==READY || user.status==INGROUP || user.status==STANDBY);
    }
}