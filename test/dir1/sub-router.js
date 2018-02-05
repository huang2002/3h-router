const Rt = require('../../3h-router');
module.exports = (req, res) => {
    Rt.endWithFile(__dirname + '/data.html', req, res).catch(console.error);
};