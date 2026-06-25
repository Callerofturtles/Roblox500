// Small shim so existing requires for './database/db' work.
// It simply re-exports the helpers from the repo-root db.js
module.exports = require('../db');
