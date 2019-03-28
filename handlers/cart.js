const jwt = require("jsonwebtoken");
const session = require("express-session");
const SECRET = "abigsecret";

exports.cartProcessGet = function (req, res) {
    session.csrfToken = jwt.sign({ newcsrf: "bar" }, SECRET, { expiresIn: 14400 });
    const pageData = {
        csrf: session.csrfToken
    };
    res.render("cart.ejs", pageData);
};

exports.cartProcessPost = function (req, res) {
    req.session.cart = req.body.cart;
    res.redirect(303, "/checkout");
};