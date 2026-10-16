import pino from 'pino';

const redactPaths = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'credential',
  'encryptedCredential',
  'encrypted_credential',
  'authorization',
  'cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'body.password',
  'body.token',
  'body.apiKey',
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  ...(process.env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {}),
});
