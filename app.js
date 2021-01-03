const
  express = require('express'),
	{ urlencoded, json } = require("body-parser")
	app = express(),
	PORT = process.env.PORT || 5000;
const
  config = require('./config'),
  i18n = require('./i18n.config'),
  secConfig = require('./security/config'),
  telConfig = require('./telegram/config');
const
  userDb = require('./database/user'),
  logDb = require('./database/logging');
const
  botApi = require('./telegram/botApi'),
  telegramReceive = require('./telegram/receive'),
  CheckIn = require('./telegram/checkin');
  

// Parse application/x-www-form-urlencoded
app.use(
  urlencoded({
    extended: true
  })
);


// Parse application/json.
app.use(json());


// Check all config and show warning
(function checkConfigs(){
  config.checkEnvVariables();
  secConfig.checkEnvVariables();
  telConfig.checkEnvVariables();
})()


function Authenticate(req, res, verify_token){
	//const token = req.query['verify_token'];

  const token = req.headers.verify_token;
	if(!token){
		// Responds with '403 Forbidden' if verify tokens do not match
		res.sendStatus(403);
		return false;
	}
	else if(token != verify_token){
		// Responds with '403 Forbidden' if verify tokens do not match
		res.sendStatus(403);
		return false;
	}
	else{
		return true;
	}
}


// Get User data
app.get(config.userUrl, async (req, res) => {
  if(!Authenticate(req, res, config.userToken)) return;

  try{
    res.status(200).send(await userDb.getUsersAsync());
  }
  catch(ex){
    res.status(400).send({
      message: 'database error occured',
      error: ex
    })
    console.error(ex);
  }
})


// Get Log data
app.get(config.logUrl, async (req, res) => {
  if(!Authenticate(req, res, config.logToken)) return;

  const limit = req.query.limit;
  const page = req.query.page;
  const telegram_name = req.query.telegram_name;
  if(limit)
    if(isNaN(limit)){
      res.status(400).send({ message: 'limit must be a valid integer value.' });
      return;
    }
    else if(limit < 1 || limit > 100){
      res.status(400).send({ message: 'limit must be between 1-100'});
      return;
    }
  if(page)
    if(isNaN(page)){
      res.status(400).send({ message: 'page must be a valid integer value.' });
      return;
    }
    else if(page < 1)
    {
      res.status(400).send({ message: 'page must be at least 1' });
      return;
    }
  
  try{
    res.status(200).send(await logDb.getLogAsync(limit, page, telegram_name));
  }
  catch(ex){
    res.status(400).send({
      message: 'database error occured',
      error: ex
    })
    console.error(ex);
  }
})


// Endpoint for telegram bot
app.post(config.telegramUrl, async (req, res) => {
  const body = req.body;

  // For Debugging only. Please disable for Production
  console.log('Received Telegram Webhook:');
  console.dir(body, {depth: null});

  res.status(200).send('EVENT_RECEIVED');

  if(body.message){
    const message = body.message;
    if(message.chat){
      const chat = message.chat;
      if(chat.type == 'private')
        await telegramReceive.handleNewPrivateMessageAsync(body);
      else if(chat.id == telConfig.adminChatID)
        await telegramReceive.handleNewAdminMessageAsync(body);
      else if(chat.id == telConfig.mainChatID)
        await telegramReceive.handleChatMemeberAsync(message);
    }
  }
  else if(body.callback_query)
    await telegramReceive.handleCallbackQueryAsync(body);
})


// Endpoint to send Check in Message
app.post(config.sendCheckinUrl, async (req, res) => {
  if(!Authenticate(req, res, config.sendCheckinToken)) return;

  res.status(200).send('SEND_CHECK_IN_RECEIVED');
  const users = await userDb.getRequireCheckInUsersAsync();
  if(!users) return;
  users.forEach(async function(user){
    try{
      await CheckIn.sendCheckInMessageAsync(user);
    }
    catch(ex){
      console.error(ex);
    }
  })
})


// Endpoint for logout if not checkin
app.post(config.logoutUrl, async(req, res)=>{
  if(!Authenticate(req, res, config.logoutToken)) return;

  res.status(200).send('LOGOUT_RECEIVED');
  const users = await userDb.getRequireLogoutUsersAsync(config.logoutPreviousHours);
  if(!users) return;
  console.log(users);
  users.forEach(async (user) =>{
      i18n.setLocale(user.language);
      await botApi.banChatMember(user.telegram_user_id);
  });
})


// Listen for requests :)
var listener = app.listen(PORT, function(){
	console.log(`The app is listening on port ${listener.address().port}`);
	config.checkEnvVariables();
});