'use strict';

const mongoose = require('mongoose');

const connectSting = 'mongodb://localhost:27017/shopDev';

mongoose
    .connect(connectSting)
    .then(() => console.log('Connected Mongodb Success'))
    .catch((err) => console.log(err));

module.exports = mongoose;
