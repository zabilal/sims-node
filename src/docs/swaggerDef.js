import Config from '../config/config.js';

const swaggerDef = {
  openapi: '3.0.3',
  info: {
    title: 'SIMS-NODE API documentation',
    version: '1.0.0',
    license: {
      name: 'MIT',
      url: 'https://github.com/hagopj13/node-express-mongoose-boilerplate/blob/master/LICENSE',
    },
  },
  servers: [
    {
      url: `http://localhost:${Config.port}/v1`,
    },
  ],
};

export default swaggerDef;
