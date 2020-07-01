const jwt = require("jsonwebtoken");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const config = require("config");
const dbConfig = config.get("dbConfig");
const db = new sqlite3.Database(`${dbConfig.dbPath}/${dbConfig.dbName}`);
const jwtSecret = config.get("jwtSecret");
const csrfSecret = config.get("csrfSecret");

exports.signupProcessGet = function (req, res) {
    session.csrfToken = jwt.sign({ newcsrf: "bar" }, csrfSecret, { expiresIn: 14400 });
    const pageData = {
        usernameError: false,
        emailError: false,
        passwordError: false,
        usernameError2: false,
        username: "",
        email: "",
        csrf: session.csrfToken
    };
    res.render("signup.ejs", pageData);
};

exports.signupProcessPost = function (req, res) {
    const saltRounds = 12;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const pageData = {
        usernameError: false,
        emailError: false,
        passwordError: false,
        usernameError2: false,
        username: username,
        email: email,
        csrf: session.csrfToken
    };
    const EMAIL_PATTERN = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    const USERNAME_PATTERN = /^[a-zA-Z0-9]{2,30}$/;
    const PASSWORD_PATTERN = /^.{6,}$/;

    if (!USERNAME_PATTERN.test(username)) {
        pageData.usernameError = true;
    }

    if (!EMAIL_PATTERN.test(email)) {
        pageData.emailError = true;
    }

    if (!PASSWORD_PATTERN.test(password)) {
        pageData.passwordError = true;
    }

    if (pageData.usernameError || pageData.emailError || pageData.passwordError) {
        return res.render("signup.ejs", pageData);
    } else {
        db.serialize(() => {
            db.get(`SELECT Username FROM Users WHERE Username = ?`, [username], function (err, row) {
                if (err) {
                    throw err;
                }
                if (row) {
                    pageData.usernameError2 = true;
                    return res.render("signup.ejs", pageData);
                } else {
                    db.serialize(() => {
                        bcrypt.hash(password, saltRounds, function (err, hash) {
                            db.run(`INSERT INTO Users (Username, Email, Password, RoleId) VALUES (?, ?, ?, 1)`, [username, email, hash], function (err) {
                                if (err) {
                                    console.log(err);
                                }
                                const token = jwt.sign({ username: username }, jwtSecret, { expiresIn: 1000*60*60 });

                                res.cookie("token", token, { expires: new Date(Date.now() + 1000*60*60), httpOnly: true });
                                return res.redirect(303, "/");
                            });
                        });
                    });
                }
            });
        });
    }
};