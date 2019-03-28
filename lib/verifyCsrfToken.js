const session = require("express-session");

exports.verifyCsrfToken = function (req, res, next) {
    const csrf = req.body.csrf;
    if (session.csrfToken !== csrf) {
        return res.render("csrf-error.ejs");
    }
    next();
};