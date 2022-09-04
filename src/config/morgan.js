import morgan, { token } from 'morgan';
import env from './config.js';
import Logger from './logger.js';

token('message', (req, res) => res.locals.errorMessage || '');

const getIpFormat = () => (env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => Logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => Logger.error(message.trim()) },
});

export default {
  successHandler,
  errorHandler,
};
