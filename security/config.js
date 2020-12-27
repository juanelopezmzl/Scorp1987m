'use strict';

const ENV_VARS = [
    'CRYPTO_PIN_SALT',
    'CRYPTO_INVITE_KEY'
];

module.exports = {
    pinSalt : process.env.CRYPTO_PIN_SALT,

    inviteKey : Buffer.from(process.env.CRYPTO_INVITE_KEY, 'base64'),
    
    checkEnvVariables(){
        ENV_VARS.forEach(function(key){
            if(!process.env[key]){
                console.warn(`WARNING: Missing the environment variable ${key}`);
            }
        })
    }
}