const upload = require( "../../middlewares/file" );
const { postQubo, getQubo } = require( "../controllers/qubo" );

const quboRoutes = require("express").Router();

quboRoutes.get("/", getQubo);
quboRoutes.post("/", upload.single('img'), postQubo);

module.exports = quboRoutes;