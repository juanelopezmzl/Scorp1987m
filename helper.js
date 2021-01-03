module.exports = {    
    /**
     * 
     * @param {string} text 
     * @returns 
     */
     replaceNumber(text){
        if (!text) return null;
        return text
            .replace('၀', '0')
            .replace('၁', '1')
            .replace('၂', '2')
            .replace('၃', '3')
            .replace('၄', '4')
            .replace('၅', '5')
            .replace('၆', '6')
            .replace('၇', '7')
            .replace('၈', '8')
            .replace('၉', '9')
    },

    /**
     * 
     * @param {string} text 
     * @returns
     */
    checkPin(text){
        const pin = text.trim();
        if(pin.length < 6 || pin.length > 10) return false;
        const parsedPin = parseInt(pin);
        if(isNaN(parsedPin)) return false;
        else return true;
    }
}