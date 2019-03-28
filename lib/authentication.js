const jwt = require("jsonwebtoken");
const session = require("express-session");
const SECRET = "abigsecret";

exports.authentication = function(allow) {
    return function (req, res, next) {
        const token = session.token;
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