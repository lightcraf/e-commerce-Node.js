exports.nocache = function (req, res, next) {
    res.set({
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Expires": "-1",
        "Pragma": "no-cache"
    });
    next();
};