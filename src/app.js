import express, { json, urlencoded } from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import Passport from 'passport';
import httpStatus from 'http-status';
import env from './config/config.js';
import Morgan from './config/morgan.js';
import jwtStrategy from './config/passport.js';
import authLimiter from './middlewares/rateLimiter.js';
import routes from './modules/index.js';
import Errors from './middlewares/error.js';
import ApiError from './utils/ApiError.js';

const app = express();

if (env !== 'test') {
  app.use(Morgan.successHandler);
  app.use(Morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(json());

// parse urlencoded request body
app.use(urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(Passport.initialize());
Passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
// app.use('/v1', routes);
routes(app);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(Errors.errorConverter);

// handle error
app.use(Errors.errorHandler);

export default app;
