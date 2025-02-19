const upload = require( "../../middlewares/file" );
const { postQubo, getQubo, deleteQubo } = require( "../controllers/qubo" );
const checkRole = require( '../../middlewares/checkRole' );

const isAuth = require( "../../middlewares/auth" );
const quboRoutes = require("express").Router();

quboRoutes.get("/", isAuth, getQubo);
quboRoutes.post("/", isAuth, upload.single('img'), postQubo);
quboRoutes.delete("/:id", [ isAuth ], deleteQubo);
module.exports = quboRoutes;