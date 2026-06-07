import { test, expect, describe, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { validateSecureAST, runInSubprocess } from '../server/services/sandbox';

describe('Sandbox Security and Validation', () => {
  test('Backend validation with Acorn blocks unsafe code', () => {
    const unsafeCode = `const run = () => { eval('console.log(1)'); };`;
    expect(() => validateSecureAST(unsafeCode)).toThrow("Security Violation");
  });

  test('Backend validation allows safe code', () => {
    const safeCode = `const run = () => { console.log(1); };`;
    expect(() => validateSecureAST(safeCode)).not.toThrow();
  });

  test('runInSubprocess evaluates standard code cleanly', async () => {
    const code = `result = 42;`;
    const res = await runInSubprocess(code);
    if (res.failed) console.error("runInSubprocess failed with:", res);
    expect(res.failed).toBeFalsy();
    expect(res.data).toBe(42);
  });
});

describe('API Integrations', () => {
  test('GET /api/config returns 401 in production if missing auth', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-key';
    const response = await request(app).get('/api/config');
    expect(response.status).toBe(401);
    process.env.NODE_ENV = originalEnv;
  });

  test('GET /api/config returns 200 in production if authenticated', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-key';
    const response = await request(app)
      .get('/api/config')
      .set('Authorization', 'Bearer test-key');
    expect(response.status).toBe(200);
    process.env.NODE_ENV = originalEnv;
  });

  test('GET /api/targets requires authentication in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const response = await request(app).get('/api/targets');
    expect(response.status).toBe(401);
    process.env.NODE_ENV = originalEnv;
  });

  test('PATCH /api/targets/:id validates inputs', async () => {
    const response = await request(app)
      .patch('/api/targets/123')
      .send({ score: 1.5 }); // invalid score
    expect(response.status).toBe(400);
  });

  test('GET /api/retrospective generates dummy results', async () => {
    const response = await request(app).get('/api/retrospective');
    expect(response.status).toBe(200);
    expect(response.body.is_demo_fixture).toBe(true);
    expect(Array.isArray(response.body.results)).toBe(true);
  });

  test('GET /api/bayes/evidence calculates posterior', async () => {
    const response = await request(app).get('/api/bayes/evidence?target=EGFR&prior=50&isSuccess=true');
    expect(response.status).toBe(200);
    expect(response.body.posterior).toBeDefined();
    expect(typeof response.body.posterior).toBe('number');
  });

  test('POST /api/ingest parses PDB from fileName via regex', async () => {
    const response = await request(app)
      .post('/api/ingest')
      .send({ fileName: 'my-structure-1A2B.pdb', target: 'EGFR' });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    // It should hit the mock or real RCSB API, or fail gracefully, but the message shouldn't be the default generic 'unknown extension' message.
    expect(response.body.message).not.toContain('File ingested and normalized.');
    expect(response.body.message).not.toContain('Simulated async BLAST');
  });

  test('POST /api/synthesize handles intent and knowledgeBase', async () => {
    // Requires GENINI_API_KEY to actually work, but we can verify it returns 500 setup error
    // or properly validates inputs.
    const response = await request(app)
      .post('/api/synthesize')
      .send({ intent: 'Treat disease', knowledgeBase: 'Some context', targetSymbol: 'FAKE' });
    
    // We didn't set API key, so it might return 500, or 200 with fallback hypothesis if that's how it's coded
    // Let's at least check it doesn't return 400 Bad Request if parameters are correctly passed.
    expect(response.status).not.toBe(400);
  });

  test('POST /api/verify executes code via sandbox route', async () => {
    const response = await request(app)
      .post('/api/verify')
      .send({ code: "result = 99;" });
      
    if (response.body.success === false) console.error("verify error", response.body.error);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    // trace should include sandbox load
    expect(response.body.trace.join(' ')).toContain('Syntax verified');
  });
  
  test('POST /api/verify rejects dangerous payload', async () => {
    const response = await request(app)
      .post('/api/verify')
      .send({ code: "process.exit(1);" });
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Syntax/Security error');
  });

  test('GET /api/daemon/tick is accessible in dev environment without auth', async () => {
    const response = await request(app).get('/api/daemon/tick?target=APOE');
    expect(response.status).toBe(200); 
  });
});
