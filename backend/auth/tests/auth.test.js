const request = require('supertest');
const express = require('express');
const app = express();

// Mock Auth Route
app.get('/auth/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-v2i' });
});

describe('Auth Service Health API', () => {
  it('should return 200 OK for health check', async () => {
    const res = await request(app).get('/auth/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/auth/unknown');
    expect(res.statusCode).toEqual(404);
  });
});
