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
  test('GET /api/config returns metadata', async () => {
    const response = await request(app).get('/api/config');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('CureForge');
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
