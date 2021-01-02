CREATE TABLE invites(
	invite_id SERIAL PRIMARY KEY,
	telegram_user_id INT,
	date_generated TIMESTAMP,
	code VARCHAR(255),
	is_used BOOLEAN,
	is_ground BOOLEAN
);

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

CREATE TABLE trackings(
	log_id SERIAL PRIMARY KEY,
	logging_date TIMESTAMP NOT NULL,
	telegram_user_id INT NOT NULL,
	activity VARCHAR(10) NOT NULL,
	by_telegram_user_id INT
);

CREATE INDEX ix_logging_date ON trackings (logging_date);
CREATE INDEX ix_trackings_telegram_user_id ON trackings (telegram_user_id);

INSERT INTO users (telegram_user_id, telegram_name, telegram_user_name, language, registered_date, status, pin)VALUES(2016022804,'Vier','TheProfessor_M','my','2021-10-29 19:04:20.696','OWNER','7OyItNbpzrct8V1AaKsRNDE3BgO7dfP3yjKp4fimtrGUwg==');