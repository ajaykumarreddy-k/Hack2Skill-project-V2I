const request = require('supertest');
const app = require('../server');

describe('Auth Service Infrastructure Audit', () => {
  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('up');
    expect(res.body.service).toBe('auth-service');
  });

  it('Unknown routes should return 404 for security', async () => {
    const res = await request(app).get('/api/unknown_endpoint');
    expect(res.statusCode).toEqual(404);
  });
});
