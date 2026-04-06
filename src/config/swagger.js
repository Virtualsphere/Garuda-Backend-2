import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Garuda Backend API',
        version: '1.0.0',
        description: 'API documentation for Garuda Backend',
    },
    servers: [
        {
            url: process.env.BACKEND_URL,
            description: 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [{
        bearerAuth: []
    }],
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
