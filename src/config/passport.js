import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import config from './config.js';
import tokenTypes from './tokens.js';
import User from '../modules/users/user.model.js';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JWTStrategy(jwtOptions, jwtVerify);

export default jwtStrategy;
