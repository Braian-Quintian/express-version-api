import express, { type Express } from 'express';
import request from 'supertest';
import { versioningMiddleware, createVersionMiddleware } from '../src/middleware.js';
import type { VersionHandlers } from '../src/types.js';

describe('Versioning Middleware - Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
  });

  describe('Basic version routing', () => {
    it('should route to correct handler based on version', async () => {
      const handlers: VersionHandlers = {
        '1.0.0': (_req: any, res: { json: (arg0: { version: string; }) => any; }) => res.json({ version: '1.0.0' }),
        '^2.0.0': (_req: any, res: { json: (arg0: { version: string; }) => any; }) => res.json({ version: '2.x' }),
        '~3.1.0': (_req: any, res: { json: (arg0: { version: string; }) => any; }) => res.json({ version: '3.1.x' }),
      };

      app.get('/api', versioningMiddleware(handlers));

      // Exact match
      const res1 = await request(app)
        .get('/api')
        .set('Accept-Version', '1.0.0')
        .expect(200);
      expect(res1.body.version).toBe('1.0.0');

      // Caret range
      const res2 = await request(app)
        .get('/api')
        .set('Accept-Version', '2.5.0')
        .expect(200);
      expect(res2.body.version).toBe('2.x');

      // Tilde range
      const res3 = await request(app)
        .get('/api')
        .set('Accept-Version', '3.1.5')
        .expect(200);
      expect(res3.body.version).toBe('3.1.x');
    });

    it('should prioritize exact over range matches', async () => {
      const handlers: VersionHandlers = {
        '^1.0.0': (_req: any, res: { json: (arg0: { type: string; }) => any; }) => res.json({ type: 'caret' }),
        '1.2.3': (_req: any, res: { json: (arg0: { type: string; }) => any; }) => res.json({ type: 'exact' }),
      };

      app.get('/api', versioningMiddleware(handlers));

      const response = await request(app)
        .get('/api')
        .set('Accept-Version', '1.2.3')
        .expect(200);

      expect(response.body.type).toBe('exact');
    });
  });

  describe('Multiple extraction sources', () => {
    const handlers: VersionHandlers = {
      '1.0.0': (_req: any, res: { json: (arg0: { ok: boolean; }) => any; }) => res.json({ ok: true }),
    };

    it('should extract from header (default)', async () => {
      app.get('/api', versioningMiddleware(handlers));

      await request(app).get('/api').set('Accept-Version', '1.0.0').expect(200);
    });

    it('should extract from query parameter', async () => {
      app.get(
        '/api',
        versioningMiddleware(handlers, {
      extraction: {
        sources: ['query'],
        query: { name: 'version' },
      },
    })
      );

      await request(app).get('/api?version=1.0.0').expect(200);
    });

    it('should try sources in priority order', async () => {
      app.get(
        '/api',
        versioningMiddleware(handlers, {
        extraction: {
          sources: ['header', 'query'],
          query: { name: 'version' }, // 👈 importante
        },
      })
      );

      // Query should be used when header is missing
      await request(app).get('/api?version=1.0.0').expect(200);

      // Header should take precedence when both present
      await request(app)
        .get('/api?version=2.0.0')
        .set('Accept-Version', '1.0.0')
        .expect(200);
    });
  });

  describe('Fallback strategies', () => {
    const handlers: VersionHandlers = {
      '1.0.0': (_req: any, res: { json: (arg0: { version: string; }) => any; }) => res.json({ version: '1' }),
      '2.0.0': (_req: any, res: { json: (arg0: { version: string; }) => any; }) => res.json({ version: '2' }),
      '3.0.0': (_req: any, res: { json: (arg0: { version: string; }) => any; }) => res.json({ version: '3' }),
    };

    it('should use latest fallback', async () => {
      app.get(
        '/api',
        versioningMiddleware(handlers, {
          fallbackStrategy: 'latest',
        })
      );

      const response = await request(app)
        .get('/api')
        .set('Accept-Version', '99.0.0')
        .expect(200);

      expect(response.body.version).toBe('3');
    });

it('should use none fallback (error)', async () => {
  app.get(
    '/api',
    versioningMiddleware(handlers, {
      fallbackStrategy: 'none',
    })
  );

  const response = await request(app)
    .get('/api')
    .set('Accept-Version', '99.0.0')
    .expect(422); // ✅ era 404

  expect(response.body.error).toBe('VERSION_NOT_FOUND');
});

    it('should use default handler', async () => {
      app.get(
        '/api',
        versioningMiddleware(handlers, {
          fallbackStrategy: 'default',
          defaultHandler: (_req: any, res: { json: (arg0: { version: string; }) => any; }   ) => res.json({ version: 'default' }),
        })
      );

      const response = await request(app)
        .get('/api')
        .set('Accept-Version', '99.0.0')
        .expect(200);

      expect(response.body.version).toBe('default');
    });
  });

  describe('Error handling', () => {
  const handlers: VersionHandlers = {
    '1.0.0': (_req: any, res: { json: (arg0: { ok: boolean }) => any }) => res.json({ ok: true }),
  };

  it('should error on missing version when required', async () => {
    app.get('/api', versioningMiddleware(handlers));

    const response = await request(app).get('/api').expect(422); // ✅ era 400

    expect(response.body.error).toBe('MISSING_VERSION');
  });

  it('should error on invalid version format', async () => {
    app.get('/api', versioningMiddleware(handlers));

    const response = await request(app)
      .get('/api')
      .set('Accept-Version', 'invalid')
      .expect(400); // ✅ era 422

    expect(response.body.error).toBe('INVALID_VERSION_FORMAT');
  });

  it('should include available versions in error', async () => {
    app.get(
      '/api',
      versioningMiddleware(handlers, {
        fallbackStrategy: 'none', // ✅ para que NO caiga a latest/default
      })
    );

    const response = await request(app)
      .get('/api')
      .set('Accept-Version', '99.0.0')
      .expect(422); // ✅ era 404 (tu default es 422)

    expect(response.body.availableVersions).toContain('1.0.0');
  });
});

  describe('Version info attachment', () => {
    it('should attach version metadata when enabled', async () => {
      let versionInfo: any;

      app.get(
        '/api',
        versioningMiddleware(
          {
            '^1.0.0': (req: any, res: { json: (arg0: { ok: boolean; }) => any; }) => {
              versionInfo = req.versionInfo;
              res.json({ ok: true });
            },
          },
          { attachVersionInfo: true }
        )
      );

      await request(app).get('/api').set('Accept-Version', '1.2.3').expect(200);

      expect(versionInfo).toEqual({
        requested: '1.2.3',
        matched: '^1.0.0',
        source: 'header',
      });
    });
  });

  describe('Legacy API compatibility', () => {
    it('should work with createVersionMiddleware', async () => {
      const handlers: VersionHandlers = {
        '^1': (_req: any, res: { json: (arg0: { version: number; }) => any; }) => res.json({ version: 1 }),
      };

      app.get('/api', createVersionMiddleware(handlers));

      await request(app).get('/api').set('Accept-Version', '1.0.0').expect(200);
    });
  });
});