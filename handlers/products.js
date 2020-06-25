const sqlite3 = require("sqlite3").verbose();
const config = require("config");
const dbConfig = config.get("dbConfig");
const db = new sqlite3.Database(`${dbConfig.dbPath}/${dbConfig.dbName}`);

exports.productCategory = function (req, res) {
    res.render("product-category.ejs");
};

exports.productList = function (req, res) {
    const category = req.params["category"].toLowerCase();
    const sortSelected = req.query.sort || "priceASC";
    const producers = req.query.producer || "";
    const producersList = '"' + producers.split(";").join('","') + '"';
    let order = "";
    let sortColumnName = "";
    let producersSearch = "";

    if (category !== "phones" && category !== "tablets") {
        return res.render("404.ejs");
    }

    if (producers !== "") {
        producersSearch = `AND producer IN (${producersList})`;
    }

    switch (sortSelected) {
        case "priceASC": order = "ASC", sortColumnName = "price"; break;
        case "priceDESC": order = "DESC", sortColumnName = "price"; break;
        case "nameASC": order = "ASC", sortColumnName = "model"; break;
        case "nameDESC": order = "DESC", sortColumnName = "model"; break;
        default: order = "ASC", sortColumnName = "price";
    }

    const sortOptions = {
        priceASC: "Price: Low to High",
        priceDESC: "Price: High to Low",
        nameASC: "Name: A - Z",
        nameDESC: "Name: Z - A"
    };
    const producerArr = [];
    const ITEMS_PER_PAGE = 8;
    let page = Number.isInteger(Number(req.query.page)) ? req.query.page - 1 : 0;

    if (page < 0) {
        page = 0;
    }

    function getProducers() {
        return new Promise((resolve, reject) => {
            db.each(`SELECT DISTINCT producer FROM products WHERE category = "${category}" ORDER BY LOWER(producer)`, [], function (err, row) {
                if (err) {
                    reject(err);
                }
                producerArr.push(row.producer);
            }, function () {
                resolve(producerArr);
            });
        });
    }

    function getNumberOfRows() {
        return new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(producer) AS count FROM products WHERE category = "${category}" ${producersSearch}`, [], function (err, row) {
                if (err) {
                    reject(err);
                }
                resolve(row.count);
            });
        });
    }

    function getFilteredProducts(producerList, numberOfRows) {
        const sql = `SELECT id, producer, model, price, image 
                FROM products WHERE category = "${category}" 
                ${producersSearch} ORDER BY ${sortColumnName} ${order} LIMIT ${ITEMS_PER_PAGE} OFFSET ${page * ITEMS_PER_PAGE}`;

        return new Promise((resolve, reject) => {
            db.all(sql, [], function (err, row) {
                if (err) {
                    reject(err);
                }

                if (row.length === 0) {
                    return res.redirect(303, "/products/" + category);
                }

                const pageData = {
                    products: row,
                    sortOptions: sortOptions,
                    sortSelected: sortSelected,
                    queryProducer: producers,
                    producerList: producerList,
                    pageTitle: category.charAt(0).toUpperCase() + category.slice(1),
                    breadcrumbPath: category.charAt(0).toUpperCase() + category.slice(1),
                    currentPage: page + 1,
                    pages: Math.ceil(numberOfRows / ITEMS_PER_PAGE)
                };

                res.render("product-list.ejs", pageData);
            });
        });
    }

    async function getProducts() {
        try {
            const producerList = await getProducers();
            const numberOfRows = await getNumberOfRows();
            await getFilteredProducts(producerList, numberOfRows); 
        } catch (error) {
            console.log(error);
        }
    }
    getProducts();
};

exports.product = function (req, res) {
    const id = req.params["id"];
    const product = req.params["product"];

    db.get(`SELECT id, producer, model, price, image, category FROM products WHERE id = ?`, [id], function (err, row) {
        if (err) {
            throw err;
        }
        
        if (row) {
            const pageData = row;
            const productName = row.model.toLowerCase().replace(/[^a-z0-9]+/gi, '_');

            if (product == productName) {
                return res.render("product.ejs", pageData);
            } else {
                return res.redirect(303, "/" + productName + "/" + id);
            }
        } else {
            return res.render("404.ejs");
        }
    });
};