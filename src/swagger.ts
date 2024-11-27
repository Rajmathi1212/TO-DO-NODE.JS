// src/swagger.ts
import ENV from './env';
import swaggerAutogen from 'swagger-autogen';

const outputFile = './swagger_output.json';
const endpointsFiles = ['./src/app.ts'];

const doc = {
  info: {
    title: 'To-Do-App',
    description: 'API Documentation for the To-Do-App.',
    version: '1.0.0',
  },
  host: ENV.BASE_URL.replace(/^https?:\/\//, ''),
  schemes: [ENV.BASE_URL.split(':')[0]],
};

swaggerAutogen()(outputFile, endpointsFiles, doc);
