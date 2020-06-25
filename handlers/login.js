const jwt = require("jsonwebtoken");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const config = require("config");
const dbConfig = config.get("dbConfig");
const db = new sqlite3.Database(`${dbConfig.dbPath}/${dbConfig.dbName}`);
const SECRET = config.get("jwtSecret");
const csrfSecret = config.get("csrfSecret");

exports.loginProcessGet = function (req, res) {
    session.csrfToken = jwt.sign({ newcsrf: "bar" }, csrfSecret, { expiresIn: 14400 });
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
                            const token = jwt.sign({ username: username }, SECRET, { expiresIn: 1000*60*60 });

                            res.cookie("token", token, { expires: new Date(Date.now() + 1000*60*60), httpOnly: true });
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