import { versioningMiddleware } from '../src/middleware.js';
import type { Response, NextFunction } from 'express';
import type { VersionedRequest } from '../src/types.js';

describe('Performance Benchmarks', () => {
  const mockReq = {
      headers: { 'accept-version': '1.2.3' },
      query: {},
      path: '/api',
      hostname: 'localhost',
      method: 'GET',
      url: '/api',
  } as unknown as VersionedRequest;

  const mockRes = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle 10000 requests efficiently', () => {
    const middleware = versioningMiddleware({
      '^1.0.0': (_req: any, res: { json: (arg0: { ok: boolean; }) => any; }) => res.json({ ok: true }),
      '^2.0.0': (_req: any, res: { json: (arg0: { ok: boolean; }) => any; }) => res.json({ ok: true }),
      '^3.0.0': (_req: any, res: { json: (arg0: { ok: boolean; }) => any; }) => res.json({ ok: true }),
    });

    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      middleware(mockReq, mockRes, mockNext);
    }

    const end = performance.now();
    const duration = end - start;
    const avgPerRequest = duration / 10000;

    console.log(`\n  ⚡ Benchmark Results:`);
    console.log(`     Total time: ${duration.toFixed(2)}ms`);
    console.log(`     Avg per request: ${avgPerRequest.toFixed(4)}ms`);
    console.log(`     Throughput: ${(10000 / (duration / 1000)).toFixed(0)} req/s\n`);

    // Should be fast (< 0.1ms per request)
    expect(avgPerRequest).toBeLessThan(0.1);
  });

  it('should handle version matching efficiently', () => {
    const middleware = versioningMiddleware({
      '1.0.0': (_req: any, res: { json: (arg0: { v: number; }) => any; }) => res.json({ v: 1 }),
      '2.0.0': (_req: any, res: { json: (arg0: { v: number; }) => any; }) => res.json({ v: 2 }),
      '^3.0.0': (_req: any, res: { json: (arg0: { v: number; }) => any; }) => res.json({ v: 3 }),
      '~4.1.0': (_req: any, res: { json: (arg0: { v: number; }) => any; }) => res.json({ v: 4 }),
    });

    const versions = ['1.0.0', '2.0.0', '3.5.0', '4.1.5'];
    const iterations = 2500; // 10000 total (2500 per version)

    const start = performance.now();

    versions.forEach((version) => {
      const req = { ...mockReq, headers: { 'accept-version': version } };
      for (let i = 0; i < iterations; i++) {
        middleware(req as unknown as VersionedRequest, mockRes, mockNext);
      }
    });

    const end = performance.now();
    const duration = end - start;
    const avgPerRequest = duration / 10000;

    console.log(`\n  ⚡ Multi-version Benchmark:`);
    console.log(`     Total requests: 10000 (2500 per version)`);
    console.log(`     Total time: ${duration.toFixed(2)}ms`);
    console.log(`     Avg per request: ${avgPerRequest.toFixed(4)}ms`);
    console.log(`     Throughput: ${(10000 / (duration / 1000)).toFixed(0)} req/s\n`);

    expect(avgPerRequest).toBeLessThan(0.15);
  });

  it('should handle fallback strategy efficiently', () => {
    const middleware = versioningMiddleware(
      {
        '^1.0.0': (_req: any, res: { json: (arg0: { ok: boolean; }) => any; }) => res.json({ ok: true }),
        '^2.0.0': (_req: any, res: { json: (arg0: { ok: boolean; }) => any; }) => res.json({ ok: true }),
      },
      {
        fallbackStrategy: 'latest',
      }
    );

    const reqWithInvalidVersion = {
      ...mockReq,
      headers: { 'accept-version': '99.0.0' },
    };

    const start = performance.now();

    for (let i = 0; i < 5000; i++) {
      middleware(reqWithInvalidVersion as unknown as VersionedRequest, mockRes, mockNext);
    }

    const end = performance.now();
    const duration = end - start;
    const avgPerRequest = duration / 5000;

    console.log(`\n  ⚡ Fallback Strategy Benchmark:`);
    console.log(`     Total time: ${duration.toFixed(2)}ms`);
    console.log(`     Avg per request: ${avgPerRequest.toFixed(4)}ms`);
    console.log(`     Throughput: ${(5000 / (duration / 1000)).toFixed(0)} req/s\n`);

    expect(avgPerRequest).toBeLessThan(0.15);
  });
});