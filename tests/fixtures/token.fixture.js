import moment from 'moment';
import jwt from '../../src/config/config.js';
import tokenTypes from '../../src/config/tokens.js';
import generateToken from '../../src/modules/auth/auth.service.js';
import userFixture from './user.fixture.js';

const accessTokenExpires = moment().add(jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = generateToken(userFixture.userOne._id, accessTokenExpires, tokenTypes.ACCESS);
const adminAccessToken = generateToken(userFixture.admin._id, accessTokenExpires, tokenTypes.ACCESS);

export default {
  userOneAccessToken,
  adminAccessToken,
};
