const tap = require('tap');
const supertest = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('../app');
const { User } = require('../src/model/aggregator.model');

const server = supertest(app);
const mockUser = {
    name: `Test User ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'Krypt()n8',
    preferences: ['movies', 'comics']
};
const updatedPreferences = ['movies', 'comics', 'games'];
const sampleArticles = [{ title: 'Test news article' }];

tap.test('news aggregator API', async (t) => {
    if (!process.env.MONGO_URI) {
        t.fail('MONGO_URI must be configured to run the integration tests');
        return;
    }

    if (!process.env.JWT_SECRET) {
        t.fail('JWT_SECRET must be configured to run the integration tests');
        return;
    }

    await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_TEST_DB || 'news_aggregator_test'
    });

    const originalAxiosGet = axios.get;
    axios.get = async () => ({ data: { articles: sampleArticles } });

    t.teardown(async () => {
        axios.get = originalAxiosGet;
        await User.deleteOne({ email: mockUser.email });
        await mongoose.disconnect();
    });

    let token;

    await t.test('signup rejects missing required fields', async (t) => {
        const response = await server.post('/users/signup').send({
            name: mockUser.name,
            password: mockUser.password
        });

        t.equal(response.status, 400);
    });

    await t.test('signup creates a user without exposing the password', async (t) => {
        const response = await server.post('/users/signup').send(mockUser);

        t.equal(response.status, 200);
        t.equal(response.body.user.email, mockUser.email);
        t.notOk(response.body.user.password);
    });

    await t.test('signup rejects a duplicate user', async (t) => {
        const response = await server.post('/users/signup').send(mockUser);

        t.equal(response.status, 409);
    });

    await t.test('login returns an authentication token', async (t) => {
        const response = await server.post('/users/login').send({
            email: mockUser.email,
            password: mockUser.password
        });

        t.equal(response.status, 200);
        t.type(response.body.token, 'string');
        token = response.body.token;
    });

    await t.test('login rejects an incorrect password', async (t) => {
        const response = await server.post('/users/login').send({
            email: mockUser.email,
            password: 'wrongpassword'
        });

        t.equal(response.status, 401);
    });

    await t.test('authenticated user can read preferences', async (t) => {
        const response = await server.get('/users/preferences')
            .set('Authorization', `Bearer ${token}`);

        t.equal(response.status, 200);
        t.same(response.body.preferences, mockUser.preferences);
    });

    await t.test('preferences cannot be read without a token', async (t) => {
        const response = await server.get('/users/preferences');

        t.equal(response.status, 401);
    });

    await t.test('authenticated user can update preferences', async (t) => {
        const response = await server.put('/users/preferences')
            .set('Authorization', `Bearer ${token}`)
            .send({ preferences: updatedPreferences });

        t.equal(response.status, 200);
        t.same(response.body.preferences, updatedPreferences);
    });

    await t.test('updated preferences are returned on the next read', async (t) => {
        const response = await server.get('/users/preferences')
            .set('Authorization', `Bearer ${token}`);

        t.equal(response.status, 200);
        t.same(response.body.preferences, updatedPreferences);
    });

    await t.test('news endpoint returns mocked articles', async (t) => {
        const response = await server.get('/news')
            .set('Authorization', `Bearer ${token}`);

        t.equal(response.status, 200);
        t.same(response.body.articles, sampleArticles);
    });

    await t.test('news endpoint rejects requests without a token', async (t) => {
        const response = await server.get('/news');

        t.equal(response.status, 401);
    });
});
