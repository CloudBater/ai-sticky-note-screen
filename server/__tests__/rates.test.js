import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const SUPPORTED_PAIRS = ['EUR', 'JPY', 'GBP', 'CNY', 'SGD'];

describe('GET /api/rates', () => {
  it('returns 200 with base USD', async () => {
    const res = await request(app).get('/api/rates');
    expect(res.status).toBe(200);
    expect(res.body.base).toBe('USD');
  });

  it('includes all 5 ECB-supported pairs', async () => {
    const res = await request(app).get('/api/rates');
    for (const code of SUPPORTED_PAIRS) {
      expect(res.body.rates).toHaveProperty(code);
    }
  });

  it('includes a note about ECB update frequency', async () => {
    const res = await request(app).get('/api/rates');
    expect(res.body.note).toMatch(/ECB/);
  });
});

describe('GET /api/rates/history', () => {
  it('returns 200 with a history array for a valid pair', async () => {
    const res = await request(app).get('/api/rates/history?pair=EUR&days=5');
    expect(res.status).toBe(200);
    expect(res.body.pair).toBe('EUR');
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(res.body.history.length).toBeGreaterThan(0);
    expect(res.body.history[0]).toHaveProperty('date');
    expect(res.body.history[0]).toHaveProperty('rate');
  });

  it('returns 400 for TWD (not in ECB reference set)', async () => {
    const res = await request(app).get('/api/rates/history?pair=TWD');
    expect(res.status).toBe(400);
  });
});
