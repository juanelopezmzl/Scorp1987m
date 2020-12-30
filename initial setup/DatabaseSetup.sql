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