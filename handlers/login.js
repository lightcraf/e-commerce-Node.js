const jwt = require("jsonwebtoken");
const session = require("express-session");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const DB_PATH = "public/db/products.db";
const db = new sqlite3.Database(DB_PATH);
const SECRET = "abigsecret";

exports.loginProcessGet = function (req, res) {
    session.csrfToken = jwt.sign({ newcsrf: "bar" }, SECRET, { expiresIn: 14400 });
    const pageData = {
        loginError: false,
        csrf: session.csrfToken
    };
    res.render("login.ejs", pageData);
};


exports.loginProcessPost = function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const pageData = {
        csrf: session.csrfToken,
        loginError: false
    };

    if (username.length > 0 && password.length > 0) {
        db.get(`SELECT Username, Password FROM Users WHERE Username = ?`, [username], function (err, row) {
            if (err) {
                throw err;
            }
            if (row) {
                if (username === row.Username) {
                    bcrypt.compare(password, row.Password, function (err, response) {
                        if (response === true) {
                            const token = jwt.sign({ username: username }, SECRET, { expiresIn: 300 });
                            session.token = token;
                            req.isLogged = true;
                            return res.redirect(303, "/");
                        } else {
                            pageData.loginError = true;
                            return res.render("login.ejs", pageData);
                        }
                    });
                }
            } else {
                pageData.loginError = true;
                return res.render("login.ejs", pageData);
            }
        });
    } else {
        pageData.loginError = true;
        return res.render("login.ejs", pageData);
    }
};


exports.logout = function (req, res) {
    session.token = null;
    delete res.locals.cart;
    delete req.session.cart;
    res.redirect(303, "/");
};