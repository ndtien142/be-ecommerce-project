'use strict';

const express = require('express');
const router = express.Router();

router.use('/v1/api', require('./access'));
router.use('/v1/api/group-equipment', require('./group-equipment'));
router.use('/v1/api/equipment-type', require('./equipment-type'));
router.use('/v1/api/unit-of-measure', require('./unit-of-measure'));
router.use('/v1/api/supplier', require('./supplier'));
router.use('/v1/api/import-receipt', require('./import-receipt'));
router.use(
    '/v1/api/equipment-manufacturer',
    require('./equipment-manufacturer'),
);
router.use('/v1/api/equipment', require('./equipment'));
router.use('/v1/api/role', require('./role'));
router.use('/v1/api/permission', require('./permission'));
router.use('/v1/api/borrow-receipt', require('./borrow-receipt'));
router.use('/v1/api/transfer-receipt', require('./transfer-receipt'));
router.use('/v1/api/liquidation-receipt', require('./liquidation-receipt'));
router.use('/v1/api/department', require('./department'));
router.use('/v1/api/room', require('./room'));
router.use('/v1/api/user', require('./user'));
router.use('/v1/api/notification', require('./notification'));
router.use('/v1/api/file-image', require('./file-image'));
router.use('/v1/api/report', require('./report'));

module.exports = router;
