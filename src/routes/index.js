'use strict';

const express = require('express');
const router = express.Router();

router.use('/v1/api/auth', require('./access'));
router.use('/v1/api/account', require('./account'));
router.use('/v1/api/role', require('./role'));
router.use('/v1/api/permission', require('./permission'));
router.use('/v1/api/user', require('./user'));
router.use('/v1/api/product', require('./product'));
router.use('/v1/api/brand', require('./brand'));
router.use('/v1/api/categories', require('./categories'));
router.use('/v1/api/cart', require('./cart'));
router.use('/v1/api/address', require('./address'));
router.use('/v1/api/shipping-method', require('./shipping-method'));
router.use('/v1/api/payment-method', require('./payment-method'));
router.use('/v1/api/momo', require('./momo'));
router.use('/v1/api/notification', require('./notification'));
router.use('/v1/api/order', require('./order'));
router.use('/v1/api/job', require('./job'));
router.use('/v1/api/dashboard', require('./dashboard'));

module.exports = router;
