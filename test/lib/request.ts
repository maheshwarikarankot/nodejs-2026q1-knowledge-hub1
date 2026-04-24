import * as request from 'supertest';
import 'dotenv/config';

// Lazy proxy: every supertest call (.get, .post, etc.) re-reads the
// in-process server set up by test/setup/afterEnv.ts. This avoids
// binding a real port — tests can run while a dev server is up.
const _request: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const server = (global as any).__SERVER__;
      if (!server) {
        throw new Error(
          'Test server not initialized. Make sure test/setup/afterEnv.ts ran in beforeAll.'
        );
      }
      return (request(server) as any)[prop];
    },
  }
);

export default _request;
