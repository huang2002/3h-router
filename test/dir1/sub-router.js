const Rt = require('../../3h-router');
module.exports = (req, res) => {
    res.endWithFile(__dirname + '/data.html').catch(console.error);
};