import Mongoose from 'mongoose';
import app from './app.js';
import Config from './config/config.js';
import Logger from './config/logger.js';

let server;
Mongoose.connect(Config.mongoose.url, Config.mongoose.options).then(() => {
  Logger.info('Connected to MongoDB');
  server = app.listen(Config.port, () => {
    Logger.info(`SIMS Server running on port: ${Config.port}
      -----------------------------------------
      Running on ${process.env.NODE_ENV}
      -----------------------------------------
      Make something great 1 bit at a time
    `);
    // Logger.info(`SMPT PORT ${Config.email.smtp.host}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      Logger.info('SIMS Server closed, Bye Bye my friends!');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  Logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  Logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
