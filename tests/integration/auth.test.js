import request from 'supertest';
import { name as _name, internet } from 'faker';
import { CREATED, BAD_REQUEST, OK, UNAUTHORIZED, NO_CONTENT, NOT_FOUND, FORBIDDEN } from 'http-status';
import { createRequest, createResponse } from 'node-mocks-http';
import moment from 'moment';
import Bcrypt from 'bcryptjs';
import app from '../../src/app.js';
import jwt from '../../src/config/config.js';
import auth from '../../src/middlewares/auth.js';
import tokenService from '../../src/modules/auth/token.service.js';
import emailService from '../../src/modules/email/email.service.js';
import ApiError from '../../src/utils/ApiError.js';
import setupTestDB from '../utils/setupTestDB.js';
import User from '../../src/modules/users/user.model.js';
import Token from '../../src/modules/auth/token.model.js';
import roleRights from '../../src/config/roles.js';
import tokenTypes from '../../src/config/tokens.js';
import userFixture from '../fixtures/user.fixture.js';
import tokenFixture from '../fixtures/token.fixture.js';

setupTestDB();

describe('Auth routes', () => {
  describe('POST /v1/auth/register', () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        name: _name.findName(),
        email: internet.email().toLowerCase(),
        password: 'password1',
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/v1/auth/register').send(newUser).expect(CREATED);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toEqual({ id: expect.anything(), name: newUser.name, email: newUser.email, role: 'user' });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: 'user' });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      await request(app).post('/v1/auth/register').send(newUser).expect(BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      newUser.email = userFixture.userOne.email;

      await request(app).post('/v1/auth/register').send(newUser).expect(BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app).post('/v1/auth/register').send(newUser).expect(BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      await request(app).post('/v1/auth/register').send(newUser).expect(BAD_REQUEST);

      newUser.password = '11111111';

      await request(app).post('/v1/auth/register').send(newUser).expect(BAD_REQUEST);
    });
  });

  describe('POST /v1/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const loginCredentials = {
        email: userFixture.userOne.email,
        password: userFixture.userOne.password,
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(OK);

      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: userFixture.userOne.name,
        email: userFixture.userOne.email,
        role: userFixture.userOne.role,
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if there are no users with that email', async () => {
      const loginCredentials = {
        email: userFixture.userOne.email,
        password: userFixture.userOne.password,
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(UNAUTHORIZED);

      expect(res.body).toEqual({ code: UNAUTHORIZED, message: 'Incorrect email or password' });
    });

    test('should return 401 error if password is wrong', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const loginCredentials = {
        email: userFixture.userOne.email,
        password: 'wrongPassword1',
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(UNAUTHORIZED);

      expect(res.body).toEqual({ code: UNAUTHORIZED, message: 'Incorrect email or password' });
    });
  });

  describe('POST /v1/auth/logout', () => {
    test('should return 204 if refresh token is valid', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userFixture.userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      await request(app).post('/v1/auth/logout').send().expect(BAD_REQUEST);
    });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userFixture.userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(NOT_FOUND);
    });
  });

  describe('POST /v1/auth/refresh-tokens', () => {
    test('should return 200 and new auth tokens if refresh token is valid', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userFixture.userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(OK);

      expect(res.body).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbRefreshTokenDoc = await Token.findOne({ token: res.body.refresh.token });
      expect(dbRefreshTokenDoc).toMatchObject({
        type: tokenTypes.REFRESH,
        user: userFixture.userOne._id,
        blacklisted: false,
      });

      const dbRefreshTokenCount = await Token.countDocuments();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      await request(app).post('/v1/auth/refresh-tokens').send().expect(BAD_REQUEST);
    });

    test('should return 401 error if refresh token is signed using an invalid secret', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH, 'invalidSecret');
      await tokenService.saveToken(refreshToken, userFixture.userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is not found in the database', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is blacklisted', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userFixture.userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is expired', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires);
      await tokenService.saveToken(refreshToken, userFixture.userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(UNAUTHORIZED);
    });

    test('should return 401 error if user is not found', async () => {
      const expires = moment().add(jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userFixture.userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(UNAUTHORIZED);
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
    });

    test('should return 204 and send reset password email to the user', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const sendResetPasswordEmailSpy = jest.spyOn(emailService, 'sendResetPasswordEmail');

      await request(app).post('/v1/auth/forgot-password').send({ email: userFixture.userOne.email }).expect(NO_CONTENT);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(userFixture.userOne.email, expect.any(String));
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordTokenDoc = await Token.findOne({ token: resetPasswordToken, user: userFixture.userOne._id });
      expect(dbResetPasswordTokenDoc).toBeDefined();
    });

    test('should return 400 if email is missing', async () => {
      await userFixture.insertUsers([userFixture.userOne]);

      await request(app).post('/v1/auth/forgot-password').send().expect(BAD_REQUEST);
    });

    test('should return 404 if email does not belong to any user', async () => {
      await request(app).post('/v1/auth/forgot-password').send({ email: userFixture.userOne.email }).expect(NOT_FOUND);
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    test('should return 204 and reset the password', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(NO_CONTENT);

      const dbUser = await User.findById(userFixture.userOne._id);
      const isPasswordMatch = await Bcrypt.compare('password2', dbUser.password);
      expect(isPasswordMatch).toBe(true);

      const dbResetPasswordTokenCount = await Token.countDocuments({
        user: userFixture.userOne._id,
        type: tokenTypes.RESET_PASSWORD,
      });
      expect(dbResetPasswordTokenCount).toBe(0);
    });

    test('should return 400 if reset password token is missing', async () => {
      await userFixture.insertUsers([userFixture.userOne]);

      await request(app).post('/v1/auth/reset-password').send({ password: 'password2' }).expect(BAD_REQUEST);
    });

    test('should return 401 if reset password token is blacklisted', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD, true);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(UNAUTHORIZED);
    });

    test('should return 401 if reset password token is expired', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().subtract(1, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(UNAUTHORIZED);
    });

    test('should return 400 if password is missing or invalid', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const expires = moment().add(jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userFixture.userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app).post('/v1/auth/reset-password').query({ token: resetPasswordToken }).expect(BAD_REQUEST);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'short1' })
        .expect(BAD_REQUEST);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password' })
        .expect(BAD_REQUEST);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: '11111111' })
        .expect(BAD_REQUEST);
    });
  });
});

describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const req = createRequest({ headers: { Authorization: `Bearer ${tokenFixture.userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user._id).toEqual(userFixture.userOne._id);
  });

  test('should call next with unauthorized error if access token is not found in header', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const req = createRequest();
    const next = jest.fn();

    await auth()(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: UNAUTHORIZED, message: 'Please authenticate' }));
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const req = createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await auth()(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: UNAUTHORIZED, message: 'Please authenticate' }));
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const expires = moment().add(jwt.accessExpirationMinutes, 'minutes');
    const refreshToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.REFRESH);
    const req = createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
    const next = jest.fn();

    await auth()(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: UNAUTHORIZED, message: 'Please authenticate' }));
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const expires = moment().add(jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.ACCESS, 'invalidSecret');
    const req = createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: UNAUTHORIZED, message: 'Please authenticate' }));
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const expires = moment().subtract(1, 'minutes');
    const accessToken = tokenService.generateToken(userFixture.userOne._id, expires, tokenTypes.ACCESS);
    const req = createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: UNAUTHORIZED, message: 'Please authenticate' }));
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const req = createRequest({ headers: { Authorization: `Bearer ${tokenFixture.userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: UNAUTHORIZED, message: 'Please authenticate' }));
  });

  test('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const req = createRequest({ headers: { Authorization: `Bearer ${tokenFixture.userOneAccessToken}` } });
    const next = jest.fn();

    await auth('anyRight')(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: FORBIDDEN, message: 'Forbidden' }));
  });

  test('should call next with no errors if user does not have required rights but userId is in params', async () => {
    await userFixture.insertUsers([userFixture.userOne]);
    const req = createRequest({
      headers: { Authorization: `Bearer ${tokenFixture.userOneAccessToken}` },
      params: { userId: userFixture.userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth('anyRight')(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with no errors if user has required rights', async () => {
    await userFixture.insertUsers([tokenFixture.admin]);
    const req = createRequest({
      headers: { Authorization: `Bearer ${tokenFixture.adminAccessToken}` },
      params: { userId: userFixture.userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth(...roleRights.get('admin'))(req, createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });
});
