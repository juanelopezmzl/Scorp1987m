"use strict";

// Required environment variables
const ENV_VARS = [
	'TELEGRAM_URL',
	'LOG_URL',
	'LOG_TOKEN',
	'LOGOUT_PREVIOUS_HOURS',
	'USER_URL',
	'USER_TOKEN',
	'SEND_CHECKIN_URL',
	'SEND_CHECKIN_TOKEN',
	'LOGOUT_URL',
	'LOGOUT_TOKEN'
];

module.exports = {
	telegramUrl: process.env.TELEGRAM_URL,
	
	logUrl: process.env.LOG_URL,
	logToken: process.env.LOG_TOKEN,

	userUrl: process.env.USER_URL,
	userToken: process.env.USER_TOKEN,

	sendCheckinUrl: process.env.SEND_CHECKIN_URL,
	sendCheckinToken: process.env.SEND_CHECKIN_TOKEN,

	logoutUrl: process.env.LOGOUT_URL,
	logoutToken: process.env.LOGOUT_TOKEN,
	logoutPreviousHours: process.env.LOGOUT_PREVIOUS_HOURS || 3,
	
	checkEnvVariables: function(){
		ENV_VARS.forEach(function(key){
			if(!process.env[key]){
				console.warn(`WARNING: Missing the environment variable ${key}`);
			}
		});
	}
};