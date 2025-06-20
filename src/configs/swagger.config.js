const swaggerJSDoc = require('swagger-jsdoc');

const SERVER_URL =
    process.env.SWAGGER_SERVER_URL || 'http://localhost:3055/v1/api';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'School Management',
            version: '1.0.0',
            description: 'API documentation for School Management application',
        },
        components: {
            parameters: {
                UserCodeHeader: {
                    name: 'x-user-code',
                    in: 'header',
                    description: 'User Code',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                },
                RefreshTokenHeader: {
                    name: 'x-rf-token',
                    in: 'header',
                    description: 'Refresh Token',
                    required: false,
                    schema: {
                        type: 'string',
                    },
                },
            },
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
        servers: [
            {
                url: SERVER_URL,
                description: 'Dynamic server based on environment',
            },
        ],
    },
    apis: ['./src/routes/*.js', './src/routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
