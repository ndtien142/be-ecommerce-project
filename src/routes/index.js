'use strict';

const express = require('express');
const router = express.Router();

router.use('/v1/api/auth', require('./access'));
router.use('/v1/api/role', require('./role'));
router.use('/v1/api/permission', require('./permission'));
router.use('/v1/api/user', require('./user'));
router.use('/v1/api/product', require('./product'));
router.use('/v1/api/brand', require('./brand'));
router.use('/v1/api/categories', require('./categories'));

module.exports = router;
