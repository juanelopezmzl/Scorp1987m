# InnGangBot
This Bot is written in Node.JS
1. Invite user to the group using invite code
2. Allow to log in and log out from group
3. Track the log in log out activity
4. Can ask to checkin
5. Can logout if not checkin

# 1. Prerequisites

[Git installation instructions](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
: Git is software for tracking changes in any set of files, usually used for coordinating work among programmers collaboratively developing source code during software development

[Heroku CLI installation instructions](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)
: Heroku is a cloud platform as a service supporting several programming languages. If you are deploying on own server or other cloud service, you don't need to install this.

[PostgresSQL installation instructions](https://devcenter.heroku.com/articles/heroku-postgresql#local-setup)
: To connect to remote database to create tables and indexes 

[Postman Chrome Extension Installation](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop)
: Postman Chrome Extension is a Google Chrome app for interacting with HTTP APIs

# 2. Prepare the app

In this step, you will clone this application that is ready to deploy

To clone a local version of this application that ready to deploy, execute the following commands in your local command shell or terminal
```
git clone https://github.com/Scorp1987/InnGangBot
cd InnGangBot
```
You now have a functioning Git repository that contains this application as well as a package.json file, which is used by Node’s dependency manager

# 3. Open Heroku Account

In this step, a free heroku account is created to host the application on the cloud server.

[Sign Up Heroku](https://signup.heroku.com)

# 4. Deply the App : Using Heroku

In this step you will deploy the app to Heroku.

Create an app on Heroku, which prepares Heroku to receive the source code.
```
heroku create {ApplicationName}
```
A git remote (called heroku) is also created in the local git respository when an heroku app is created.
Heroku generates a random name if you don't provide {ApplicationName}

To deploy the source code, execute the following commands in your local command shell or terminal
```
git push heroku main
```

# 5. Database Setup : Using Heroku Postgres
In this step, you will create database to store user information, activities information
## 5.1 Create Database
- Go to [Heroku Dashboard](https://dashboard.heroku.com/apps) and click on the {ApplicationName} which you created in Step4
- Click "**Resources**" tab then find "**Heroku Postgres**" under "**Add-ons**" section
- You may select "Hobby Dev - Free" which allow to store up to 10,000 rows then click "Submit Order Form" to create postgres database add-on that will link to the application
## 5.2 Create Tables and Indexes in Database
To create tables and indexes, execute following commands in your local command shell or terminal
```
heroku pg:psql
```
Send the following sql statement to create table to record invitation information
```
CREATE TABLE invites(
	invite_id SERIAL PRIMARY KEY,
	telegram_user_id INT,
	date_generated TIMESTAMP,
	code VARCHAR(255),
	is_used BOOLEAN,
	is_ground BOOLEAN
);
```
Send the following sql statement to create table to record user information
```
CREATE TABLE users(
	telegram_user_id INT PRIMARY KEY,
	telegram_name VARCHAR(50),
	telegram_user_name VARCHAR(20),
	pin VARCHAR(255),
	language VARCHAR(2) NOT NULL,
	inviter_telegram_user_id INT,
	invite_code_generated_date TIMESTAMP,
	registered_date TIMESTAMP,
	status VARCHAR(10),
	is_ground BOOLEAN
);
```
Send the following sql statement to create table to track activities
```
CREATE TABLE trackings(
	log_id SERIAL PRIMARY KEY,
	logging_date TIMESTAMP NOT NULL,
	telegram_user_id INT NOT NULL,
	activity VARCHAR(10) NOT NULL,
	by_telegram_user_id INT
);
```

# 5. Create Telegram Bot
- Talk to [BotFather](https://t.me/botfather) in telegram app
- Click **Start** button if this is the first time talking to BotFather
- Choose **Create a new bot** from **Menu** or send **/newbot** to BotFather
- Follow the subsequent instruction from BotFather
- Upon completion of creating telegram bot, you will be provided with {BotToken} from BotFather

# 6. Setup Infrastructure in telegram


Go to [Heroku Dashboard](https://dashboard.heroku.com/apps) and click on the {ApplicationName} which you created in Step4.

Click Settings then Click **Reveal Config Vars** to set the configuration of the applications

[Create a Telegram Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot)
