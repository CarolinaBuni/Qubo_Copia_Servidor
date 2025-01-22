const upload = require( "../../middlewares/file" );
const { postQubo, getQubo, deleteQubo } = require( "../controllers/qubo" );

const quboRoutes = require("express").Router();

quboRoutes.get("/", getQubo);
quboRoutes.post("/", upload.single('img'), postQubo);
quboRoutes.delete("/:id", deleteQubo);
module.exports = quboRoutes;