const express = require('express');
const quboRoutes = require( '../api/routes/qubo' );

const router = express.Router();

router.use("/qubo", quboRoutes);

module.exports = router;