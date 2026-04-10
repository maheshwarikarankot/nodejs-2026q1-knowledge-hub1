import { Buffer } from 'buffer';

// Node.js v25 removed SlowBuffer, but jsonwebtoken's transitive dependency still reads it.
const bufferModule = require('buffer') as { SlowBuffer?: typeof Buffer };
if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = Buffer;
}
