exports.logoutProcessGet = function (req, res) {
    res.clearCookie("token");
    delete res.locals.cart;
    delete req.session.cart;
    res.redirect(303, "/");
};