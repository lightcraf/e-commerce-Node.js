const jwt = require("jsonwebtoken");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const config = require("config");
const dbConfig = config.get("dbConfig");
const db = new sqlite3.Database(`${dbConfig.dbPath}/${dbConfig.dbName}`);
const SECRET = config.get("jwtSecret");

exports.checkoutProcessGet = function (req, res) {
    if (!res.locals.cart) {
        return res.redirect(303, "/cart");
    }

    const cart = JSON.parse(res.locals.cart);
    const productsId = cart.map(function (i) {
        return i.id;
    });
    const data = [];
    let totalSum = 0;

    db.each(`SELECT id, producer, model, price, image FROM products WHERE id IN (${productsId})`, [], function (err, row) {
        if (err) {
            throw err;
        }
        for (let i = 0; i < cart.length; i++) {
            if (row.id === Number(cart[i].id)) {
                row.quantity = Number(cart[i].quantity);
                totalSum += row.price * Number(cart[i].quantity);
            }
        }
        data.push(row);
    }, function () {
        const pageData = {
            firstname: "",
            lastname: "",
            address: "",
            email: "",
            products: data,
            totalSum: totalSum,
            csrf: session.csrfToken,
            firstnameError: false,
            lastnameError: false,
            emailError: false
        };
        res.render("checkout.ejs", pageData);
    });
};

exports.checkoutProcessPost = function (req, res) {
    if (!res.locals.cart) {
        return res.redirect(303, "/cart");
    }

    const cart = JSON.parse(res.locals.cart);
    const productsId = cart.map(function (i) {
        return i.id;
    });
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const address = req.body.address;
    const email = req.body.email;
    let username = "";
    const NAME_PATTERN = /^[a-zA-Z]{2,50}$/;
    const EMAIL_PATTERN = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    const pageData = {
        firstname: firstname,
        lastname: lastname,
        address: address,
        email: email,
        firstnameError: false,
        lastnameError: false,
        emailError: false
    };
    const token = req.cookies.token;

    if (!NAME_PATTERN.test(firstname)) {
        pageData.firstnameError = true;
    }

    if (!NAME_PATTERN.test(lastname)) {
        pageData.lastnameError = true;
    }

    if (!EMAIL_PATTERN.test(email)) {
        pageData.emailError = true;
    }

    if (pageData.firstnameError || pageData.lastnameError || pageData.emailError) {
        const sql = `SELECT id, producer, model, price, image FROM products WHERE id IN (${productsId})`;
        const data = [];
        let totalSum = 0;

        db.serialize(function () {
            db.each(sql, [], function (err, row) {
                if (err) {
                    throw err;
                }
                for (let i = 0; i < cart.length; i++) {
                    if (row.id === Number(cart[i].id)) {
                        row.quantity = Number(cart[i].quantity);
                        totalSum += row.price * Number(cart[i].quantity);
                    }
                }
                data.push(row);
            }, function () {
                pageData.products = data;
                pageData.totalSum = totalSum;
                pageData.csrf = session.csrfToken;
                res.render("checkout.ejs", pageData);
            });
        });
    } else {
        if (token) {
            jwt.verify(token, SECRET, function (err, decoded) {
                if (err) {
                    console.log(err);
                } else {
                    req.decoded = decoded;
                    username = req.decoded.username;
                    makeOrderForRegisteredUser();
                }
            });
        } else {
            makeOrderForUnregisteredUser();
            req.session.cart = null;
        }
    }

    function insertVisitor() {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO Visitors (FirstName, LastName, IsReg) VALUES ($firstname, $lastname, false)`, { $firstname: firstname, $lastname: lastname }, function (err) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    function getVisitorId() {
        return new Promise((resolve, reject) => {
            db.get(`SELECT Id FROM Visitors WHERE FirstName = ? AND LastName = ?`, [firstname, lastname], function (err, row) {
                if (err) {
                    reject(err);
                }
                resolve(row.Id);
            });
        });
    }

    function getUserId() {
        return new Promise((resolve, reject) => {
            db.get(`SELECT Id FROM Users WHERE Username = ?`, [username], function (err, row) {
                if (err) {
                    reject(err);
                }
                resolve(row.Id);
            });
        });
    }

    function getOrderId(userId, IsReg) {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO Orders (UserId, DeliveryAddress, IsPaid, IsReg) VALUES ($userId, $address, 1, $IsReg)`, { $userId: userId, $address: address, $IsReg: IsReg }, function (err) {
                if (err) {
                    reject(err);
                }
                resolve(this.lastID);
            });
        });
    }

    function fillOrderRow(userId, IsReg) {
        const orderRow = [];
        return new Promise((resolve, reject) => {
            db.get(`SELECT MAX(Id) maxOrderId FROM Orders WHERE UserId = ? AND IsReg = ?`, [userId, IsReg], function (err, row) {
                if (err) {
                    reject(err);
                }
                cart.forEach(function (item, index, arr) {
                    orderRow.push('(' + row.maxOrderId + ', ' + item.id + ', ' + item.quantity + ')');
                });
                resolve(orderRow);
            });
        });
    }

    function insertOrderItems(orderId, orderRow) {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO OrderItems (OrderId, ProductId, Quantity) VALUES ${orderRow.join(",")}`, function (err) {
                if (err) {
                    reject(err);
                }
                const pageData = {
                    orderId: orderId,
                    clearLocalStorage: true
                };
                res.render("thank-you.ejs", pageData);
            });
        });
    }

    async function makeOrderForUnregisteredUser() {
        try {
            await insertVisitor();
            const userId = await getVisitorId();
            const orderId = await getOrderId(userId, false);
            const orderRow = await fillOrderRow(userId, false);
            await insertOrderItems(orderId, orderRow);
        } catch (error) {
            console.log(error);
        }
    }

    async function makeOrderForRegisteredUser() {
        try {
            const userId = await getUserId();
            const orderId = await getOrderId(userId, true);
            const orderRow = await fillOrderRow(userId, true);
            await insertOrderItems(orderId, orderRow);
        } catch (error) {
            console.log(error);
        }
    }
};