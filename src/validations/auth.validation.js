import JOI from 'joi';
import validator from './custom.validation.js';

const register = {
  body: JOI.object().keys({
    email: JOI.string().required().email(),
    password: JOI.string().required().custom(validator.password),
    firstName: JOI.string().required(),
    lastName: JOI.string().required(),
  }),
};

const login = {
  body: JOI.object().keys({
    email: JOI.string().required(),
    password: JOI.string().required(),
  }),
};

const logout = {
  body: JOI.object().keys({
    refreshToken: JOI.string().required(),
  }),
};

const refreshTokens = {
  body: JOI.object().keys({
    refreshToken: JOI.string().required(),
  }),
};

const forgotPassword = {
  body: JOI.object().keys({
    email: JOI.string().email().required(),
  }),
};

const resetPassword = {
  query: JOI.object().keys({
    token: JOI.string().required(),
  }),
  body: JOI.object().keys({
    password: JOI.string().required().custom(validator.password),
  }),
};

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
};
