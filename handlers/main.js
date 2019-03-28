const sqlite3 = require("sqlite3").verbose();
const DB_PATH = "public/db/products.db";
const db = new sqlite3.Database(DB_PATH);

exports.home = function (req, res) {
    res.render("index.ejs");
};

exports.search = function (req, res) {
    const pageData = {
        products: 0,
        searchInput: req.query.q,
        pages: 0
    };
    const searchInput = req.query.q.replace(/[^\sa-z0-9]+/gi, "");

    if (searchInput === "") {
        return res.render("search.ejs", pageData);
    }

    const ITEMS_PER_PAGE = 8;
    let producerCount = 0;
    let page = Number.isInteger(Number(req.query.page)) ? req.query.page - 1 : 0;

    if (page < 0) {
        page = 0;
    }

    const whereArr = [];
    const words = searchInput.split(" ");

    for (let i = 0; i < words.length; i++) {
        whereArr.push('producer LIKE "%' + words[i] + '%" OR model LIKE "%' + words[i] + '%"');
    }

    const where = whereArr.join(' OR ');

    db.get(`SELECT COUNT(producer) AS count FROM products WHERE ${where}`, [], function (err, row) {
        if (err) {
            throw err;
        }
        producerCount = row.count;
    });

    db.serialize(function () {
        db.all(`SELECT id, producer, model, price, image FROM products WHERE ${where} LIMIT ${ITEMS_PER_PAGE} OFFSET ${page * ITEMS_PER_PAGE}`, [], function (err, row) {
            if (err) {
                throw err;
            }
            pageData.products = row;
            pageData.currentPage = page + 1;
            pageData.pages = Math.ceil(producerCount / ITEMS_PER_PAGE);
            res.render("search.ejs", pageData);
        });
    });
};