"use strict";

// Required environment variables
const ENV_VARS = [
	'TELEGRAM_URL',
	'LOG_URL',
	'LOG_TOKEN',
	'USER_URL',
	'USER_TOKEN'
];

module.exports = {
	telegramUrl: process.env.TELEGRAM_URL,
	
	logUrl: process.env.LOG_URL,
	logToken: process.env.LOG_TOKEN,

	userUrl: process.env.USER_URL,
	userToken: process.env.USER_TOKEN,
	
	checkEnvVariables: function(){
		ENV_VARS.forEach(function(key){
			if(!process.env[key]){
				console.warn(`WARNING: Missing the environment variable ${key}`);
			}
		});
	}
};