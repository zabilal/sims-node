import request from 'supertest';
import faker from 'faker';
import httpStatus from 'http-status';
import app from '../../src/app.js';
import setupTestDB from '../utils/setupTestDB.js';
import User from '../../src/modules/users/user.model.js';
import userFixture from '../fixtures/user.fixture.js';
import tokenFixture from '../fixtures/token.fixture.js';

setupTestDB();

describe('User routes', () => {
  describe('POST /v1/users', () => {
    let newUser;

    beforeEach(() => {
      newUser = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'user',
      };
    });

    test('should return 201 and successfully create new user if data is ok', async () => {
      await userFixture.userFixture.insertUsers([userFixture.admin]);

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({ id: expect.anything(), name: newUser.name, email: newUser.email, role: newUser.role });

      const dbUser = await User.findById(res.body.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: newUser.role });
    });

    test('should be able to create an admin as well', async () => {
      await userFixture.insertUsers([userFixture.admin]);
      newUser.role = 'admin';

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body.role).toBe('admin');

      const dbUser = await User.findById(res.body.id);
      expect(dbUser.role).toBe('admin');
    });

    test('should return 401 error is access token is missing', async () => {
      await request(app).post('/v1/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if logged in user is not admin', async () => {
      await userFixture.insertUsers([userFixture.userOne]);

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(newUser)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 error if email is invalid', async () => {
      await userFixture.insertUsers([userFixture.admin]);
      newUser.email = 'invalidEmail';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await userFixture.insertUsers([userFixture.admin, userFixture.userOne]);
      newUser.email = userFixture.userFixture.userOne.email;

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      await userFixture.insertUsers([userFixture.admin]);
      newUser.password = 'passwo1';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      await userFixture.insertUsers([userFixture.admin]);
      newUser.password = 'password';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = '1111111';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if role is neither user nor admin', async () => {
      await userFixture.insertUsers([userFixture.admin]);
      newUser.role = 'invalid';

      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/users', () => {
    test('should return 200 and apply the default query options', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0]).toEqual({
        id: userFixture.userOne._id.toHexString(),
        name: userFixture.userOne.name,
        email: userFixture.userOne.email,
        role: userFixture.userOne.role,
      });
    });

    test('should return 401 if access token is missing', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      await request(app).get('/v1/users').send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if a non-admin is trying to access all users', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.tokenFixture.userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should correctly apply filter on name field', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ name: userFixture.userOne.name })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(userFixture.userOne._id.toHexString());
    });

    test('should correctly apply filter on role field', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ role: 'user' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 2,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(userFixture.userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userFixture.userFixture.userTwo._id.toHexString());
    });

    test('should correctly sort the returned array if descending sort param is specified', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ sortBy: 'role:desc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(userFixture.userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userFixture.userFixture.userTwo._id.toHexString());
      expect(res.body.results[2].id).toBe(userFixture.admin._id.toHexString());
    });

    test('should correctly sort the returned array if ascending sort param is specified', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ sortBy: 'role:asc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results[0].id).toBe(userFixture.admin._id.toHexString());
      expect(res.body.results[1].id).toBe(userFixture.userOne._id.toHexString());
      expect(res.body.results[2].id).toBe(userFixture.userFixture.userTwo._id.toHexString());
    });

    test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ sortBy: 'role:desc,name:asc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);

      const expectedOrder = [userFixture.userOne, userFixture.userTwo, userFixture.admin].sort((a, b) => {
        if (a.role < b.role) {
          return 1;
        }
        if (a.role > b.role) {
          return -1;
        }
        return a.name < b.name ? -1 : 1;
      });

      expectedOrder.forEach((user, index) => {
        expect(res.body.results[index].id).toBe(user._id.toHexString());
      });
    });

    test('should limit returned array if limit param is specified', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].id).toBe(userFixture.userOne._id.toHexString());
      expect(res.body.results[1].id).toBe(userFixture.userTwo._id.toHexString());
    });

    test('should return the correct page if page and limit params are specified', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo, userFixture.admin]);

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .query({ page: 2, limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 2,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(userFixture.admin._id.toHexString());
    });
  });

  describe('GET /v1/users/:userId', () => {
    test('should return 200 and the user object if data is ok', async () => {
      await userFixture.insertUsers([userFixture.userOne]);

      const res = await request(app)
        .get(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.tokenFixture.userOneAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({
        id: userFixture.userOne._id.toHexString(),
        email: userFixture.userOne.email,
        name: userFixture.userOne.name,
        role: userFixture.userOne.role,
      });
    });

    test('should return 401 error if access token is missing', async () => {
      await userFixture.insertUsers([userFixture.userOne]);

      await request(app).get(`/v1/users/${userFixture.userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to get another user', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo]);

      await request(app)
        .get(`/v1/users/${userFixture.userFixture.userTwo._id}`)
        .set('Authorization', `Bearer ${tokenFixture.tokenFixture.userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and the user object if admin is trying to get another user', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.admin]);

      await request(app)
        .get(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await userFixture.insertUsers([userFixture.admin]);

      await request(app)
        .get('/v1/users/invalidId')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user is not found', async () => {
      await userFixture.insertUsers([userFixture.admin]);

      await request(app)
        .get(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    test('should return 204 if data is ok', async () => {
      await userFixture.insertUsers([userFixture.userOne]);

      await request(app)
        .delete(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userFixture.userOne._id);
      expect(dbUser).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await userFixture.insertUsers([userFixture.userOne]);

      await request(app).delete(`/v1/users/${userFixture.userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to delete another user', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo]);

      await request(app)
        .delete(`/v1/users/${userFixture.userTwo._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 204 if admin is trying to delete another user', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.admin]);

      await request(app)
        .delete(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await userFixture.insertUsers([userFixture.admin]);

      await request(app)
        .delete('/v1/users/invalidId')
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user already is not found', async () => {
      await userFixture.insertUsers([userFixture.admin]);

      await request(app)
        .delete(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/users/:userId', () => {
    test('should return 200 and successfully update user if data is ok', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const updateBody = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'newPassword1',
      };

      const res = await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({
        id: userFixture.userOne._id.toHexString(),
        name: updateBody.name,
        email: updateBody.email,
        role: 'user',
      });

      const dbUser = await User.findById(userFixture.userOne._id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(updateBody.password);
      expect(dbUser).toMatchObject({ name: updateBody.name, email: updateBody.email, role: 'user' });
    });

    test('should return 401 error if access token is missing', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const updateBody = { name: faker.name.findName() };

      await request(app).patch(`/v1/users/${userFixture.userOne._id}`).send(updateBody).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user is updating another user', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/${userFixture.userTwo._id}`)
        .set('Authorization', `Bearer ${tokenFixture.tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and successfully update user if admin is updating another user', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.admin]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 404 if admin is updating another user that is not found', async () => {
      await userFixture.insertUsers([userFixture.admin]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await userFixture.insertUsers([userFixture.admin]);
      const updateBody = { name: faker.name.findName() };

      await request(app)
        .patch(`/v1/users/invalidId`)
        .set('Authorization', `Bearer ${tokenFixture.adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const updateBody = { email: 'invalidEmail' };

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already taken', async () => {
      await userFixture.insertUsers([userFixture.userOne, userFixture.userTwo]);
      const updateBody = { email: userFixture.userTwo.email };

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should not return 400 if email is my email', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const updateBody = { email: userFixture.userOne.email };

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 400 if password length is less than 8 characters', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const updateBody = { password: 'passwo1' };

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password does not contain both letters and numbers', async () => {
      await userFixture.insertUsers([userFixture.userOne]);
      const updateBody = { password: 'password' };

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);

      updateBody.password = '11111111';

      await request(app)
        .patch(`/v1/users/${userFixture.userOne._id}`)
        .set('Authorization', `Bearer ${tokenFixture.userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
