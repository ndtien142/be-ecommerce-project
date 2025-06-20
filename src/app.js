require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
// const { default: helmet } = require('helmet');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./configs/swagger.config');

const app = express();

app.use(
    cors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Origin',
            'X-Requested-With',
            'Accept',
            'Access-Control-Allow-Headers',
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Request-Headers',
            'Access-Control-Request-Method',
            'X-User-Code',
            'X-Api-Key',
        ],
    }),
);

app.use(bodyParser.json());

app.use(morgan('dev'));
// morgan("combined");
// morgan("tiny");
// morgan("short");
// morgan("common");
app.use(
    helmet({
        crossOriginOpenerPolicy: false, // ❌ disable header gây lỗi
        originAgentCluster: false, // ❌ disable nếu cần
    }),
);
app.use(compression());

// init middlewares

// init db
require('./models/index');
// const { countConnect } = require("./helpers/check.connect");
// countConnect();

// init swagger
app.use('/v1/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// init routes
app.use('/', require('./routes'));

app.use((err, req, res, next) => {
    // Handle errors globally
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        code: statusCode || 500,
        status: 'error',
        stack: err.stack,
    });
});

// handling error

module.exports = app;
