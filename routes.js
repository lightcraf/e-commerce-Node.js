const main = require("./handlers/main.js");
const login = require("./handlers/login.js");
const logout = require("./handlers/logout.js");
const signup = require("./handlers/signup.js");
const products = require("./handlers/products.js");
const cart = require("./handlers/cart.js");
const checkout = require("./handlers/checkout.js");
const auth = require("./lib/authentication.js");
const csrfToken = require("./lib/verifyCsrfToken.js");
const cartValidation = require("./lib/cartValidation.js");
const resHeader = require("./lib/nocache.js");

module.exports = function (app) {
    app.get("/", main.home);
    app.get("/search", main.search);

    app.get("/login", auth.authentication(false), resHeader.nocache, login.loginProcessGet);
    app.post("/login", csrfToken.verifyCsrfToken, resHeader.nocache, login.loginProcessPost,);

    app.get("/logout", auth.authentication(true), logout.logoutProcessGet);

    app.get("/signup", auth.authentication(false), signup.signupProcessGet);
    app.post("/signup", csrfToken.verifyCsrfToken, signup.signupProcessPost);

    app.get("/products", products.productCategory);
    app.get("/products/:category", products.productList);
    app.get("/:product/:id", products.product);

    app.get("/cart", cart.cartProcessGet);
    app.post("/cart", csrfToken.verifyCsrfToken, cartValidation.validateCart, cart.cartProcessPost);

    app.get("/checkout", resHeader.nocache, checkout.checkoutProcessGet);
    app.post("/checkout", resHeader.nocache, csrfToken.verifyCsrfToken, checkout.checkoutProcessPost);
};