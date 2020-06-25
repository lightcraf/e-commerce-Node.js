const jwt = require("jsonwebtoken");
const session = require("express-session");
const config = require("config");
const csrfSecret = config.get("csrfSecret");

exports.cartProcessGet = function (req, res) {
    session.csrfToken = jwt.sign({ newcsrf: "bar" }, csrfSecret, { expiresIn: 14400 });
    const pageData = {
        csrf: session.csrfToken
    };
    res.render("cart.ejs", pageData);
};

exports.cartProcessPost = function (req, res) {
    req.session.cart = req.body.cart;
    res.redirect(303, "/checkout");
};