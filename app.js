"use strict";
const path = require("path");
const logger = require("morgan");
const express = require("express");

const app = express();
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(function (req, res, next) {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
});
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({ error: err });
});
app.set("port", process.env.PORT || 3000);
app.listen(app.get("port"));
