const jwt = require("jsonwebtoken");
const config = require("config");
const SECRET = config.get("jwtSecret");

exports.authentication = function(allow) {
    return function (req, res, next) {
        const token = req.cookies.token;

        if (token) {
            jwt.verify(token, SECRET, function (err, decoded) {
                if (err) {
                    next();
                } else {
                    if (allow === false) {
                        return res.redirect(303, "/");
                    }
                    else if (allow === true) {
                        next();
                    }
                }
            });
        } else {
            if (allow === true) {
                return res.redirect(303, "/");
            } else if (allow === false) {
                next();
            }
        }
    };
};