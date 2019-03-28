exports.validateCart = function(req, res, next) {
    const cart = req.body.cart;

    if (cart === "" || JSON.parse(cart).length === 0 || !Array.isArray(JSON.parse(cart))) {
        return res.redirect(303, "/");
    }

    const cartArr = JSON.parse(cart);

    for (let i = 0; i < cartArr.length; i++) {
        if (Object.keys(cartArr[i])[0] !== "id" || Object.keys(cartArr[i])[1] !== "quantity") {
            return res.redirect(303, "/");
        }

        if (!Number.isInteger(Number(cartArr[i].id)) || !Number.isInteger(Number(cartArr[i].quantity))) {
            return res.redirect(303, "/");
        }

        if (Number(cartArr[i].quantity) < 1 || Number(cartArr[i].quantity) > 100) {
            return res.redirect(303, "/");
        }

        if (Object.keys(cartArr[i]).length !== 2) {
            return res.redirect(303, "/");
        }

    }
    next();
};