const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.set("views", __dirname + "/public/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.set("port", process.env.PORT || 8080);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false
}));

const SECRET = "abigsecret";

app.use(function (req, res, next) {
    // create a domain for this request
    const domain = require("domain").create();
    // handle errors on this domain
    domain.on("error", function (err) {
        console.error("DOMAIN ERROR CAUGHT\n", err.stack);
        try {
            // failsafe shutdown in 5 seconds
            setTimeout(function () {
                console.error("Failsafe shutdown.");
                process.exit(1);
            }, 5000);

            // disconnect from the cluster
            const worker = require("cluster").worker;
            if (worker) worker.disconnect();

            // stop taking new requests
            server.close();

            try {
                // attempt to use Express error route
                next(err);
            } catch (error) {
                // if Express error route failed, try
                // plain Node response
                console.error("Express error mechanism failed.\n", error.stack);
                res.statusCode = 500;
                res.setHeader("content-type", "text/plain");
                res.end("Server error.");
            }
        } catch (error) {
            console.error("Unable to send 500 response.\n", error.stack);
        }
    });

    // add the request and response objects to the domain
    domain.add(req);
    domain.add(res);

    // execute the rest of the request chain in the domain
    domain.run(next);
});

app.use(function (req, res, next) {
    res.locals.cart = req.session.cart;
    next();
});

app.use(function (req, res, next) {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, SECRET, function (err, decoded) {
            if (err) {
                res.locals.isLogged = false;
                next();
            } else {
                req.decoded = decoded;
                res.locals.isLogged = true;
                res.locals.username = req.decoded.username;
                next();
            }
        });
    } else {
        res.locals.isLogged = false;
        next();
    }
});

require("./routes.js")(app);

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).render("500.ejs");
});

app.use(function (req, res, next) {
    res.status(404).render("404.ejs");
});

app.listen(app.get("port"), function () {
    console.log("Express started on http://localhost:" +
        app.get("port") + "; press Ctrl-C to terminate.");
});