//* routes qubo.js

const upload = require( "../../middlewares/file" );
const { postQubo, getQubo, deleteQubo } = require( "../controllers/qubo" );

const { isAuth, hasRole } = require( "../../middlewares/auth" );
const quboRoutes = require("express").Router();

quboRoutes.get("/", isAuth, getQubo);
quboRoutes.post("/", isAuth, upload.single('img'), postQubo);
quboRoutes.delete("/:id",  isAuth , hasRole(['Admin']), deleteQubo);
module.exports = quboRoutes;