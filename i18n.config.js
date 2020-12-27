
const i18n = require("i18n"),
  path = require("path");

i18n.configure({
  locales: [
    "en",
    "my"
  ],
  defaultLocale: "en",
  directory: path.join(__dirname, "locales"),
  objectNotation: true,
  api: {
    __: "translate",
    __n: "translateN"
  }
});

module.exports = i18n;
