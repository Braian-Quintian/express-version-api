import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { versioningMiddleware } from '../src/index.js';

declare global {
  namespace Express {
    interface Request {
      versionInfo?: {
        requested: string;
        matched: string;
        source: string;
      };
    }
  }
}

describe('versioningMiddleware (integration)', () => {
  test('routes to matching handler by header version', async () => {
    const app = express();

    app.get(
      '/api',
      versioningMiddleware(
        {
          '^1': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v1' }); },
          '^2': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v2' }); },
        },
        {
          extraction: {
            sources: ['header'],
            header: { name: 'x-api-version' },
          },
        }
      )
    );

    const res = await request(app).get('/api').set('x-api-version', '1.2.3');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'v1' });
  });

  test('missing version returns 400 when requireVersion=true', async () => {
    const app = express();

    app.get(
      '/api',
      versioningMiddleware(
        {
          '^1': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v1' }); },
        },
        {
          requireVersion: true,
          extraction: {
            sources: ['header'],
            header: { name: 'x-api-version' },
          },
        }
      )
    );

    const res = await request(app).get('/api');

    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      error: 'MISSING_VERSION',
    });
  });

  test('invalid version format returns 422', async () => {
    const app = express();

    app.get(
      '/api',
      versioningMiddleware(
        {
          '^1': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v1' }); },
        },
        {
          extraction: {
            sources: ['header'],
            header: { name: 'x-api-version' },
          },
        }
      )
    );

    const res = await request(app).get('/api').set('x-api-version', 'nope');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: 'INVALID_VERSION_FORMAT',
    });
  });

  test('no match uses fallback=none and returns 404 with availableVersions', async () => {
    const app = express();

    app.get(
      '/api',
      versioningMiddleware(
        {
          '^1': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v1' }); },
          '2.0.0': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v2exact' }); },
        },
        {
          fallbackStrategy: 'none',
          extraction: {
            sources: ['header'],
            header: { name: 'x-api-version' },
          },
          errorResponse: {
            includeRequestedVersion: true,
          },
        }
      )
    );

    const res = await request(app).get('/api').set('x-api-version', '9.9.9');

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('VERSION_NOT_FOUND');
    expect(res.body.requestedVersion).toBe('9.9.9');
    expect(Array.isArray(res.body.availableVersions)).toBe(true);
    expect(res.body.availableVersions.length).toBeGreaterThan(0);
  });

  test('fallback=latest uses latest handler when version missing and requireVersion=false', async () => {
    const app = express();

    app.get(
      '/api',
      versioningMiddleware(
        {
          '^1': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v1' }); },
          '^3': (_req: Request, res: Response) => { res.status(200).json({ handler: 'v3' }); },
        },
        {
          requireVersion: false,
          fallbackStrategy: 'latest',
          extraction: {
            sources: ['header'],
            header: { name: 'x-api-version' },
          },
        }
      )
    );

    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ handler: 'v3' });
  });

  test('attachVersionInfo adds req.versionInfo', async () => {
    const app = express();

    app.get(
      '/api',
      versioningMiddleware(
        {
          '^1': (req: Request, res: Response) => {
            res.status(200).json({ versionInfo: req.versionInfo });
          },
        },
        {
          attachVersionInfo: true,
          extraction: {
            sources: ['header'],
            header: { name: 'x-api-version' },
          },
        }
      )
    );

    const res = await request(app).get('/api').set('x-api-version', '1.0.1');

    expect(res.status).toBe(200);
    expect(res.body.versionInfo).toMatchObject({
      requested: '1.0.1',
      matched: '^1',
      source: 'header',
    });
  });
});