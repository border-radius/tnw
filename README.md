# tnw
get fresh autistic jokes right in your telegram

### Installation

Clone https://github.com/border-radius/tnw repo and install dependencies with `npm install`.

Create `config.json` like this:

```json
{
  "mongodb": "mongodb://localhost/tnw",
  "token": "telegram_bot_token",
  "bnwtoken": "bnw_bot_token",
  "blacklist": [],
  "options": {
    "polling": 5
  }
}

```

Launch with `node index` or `npm start`
