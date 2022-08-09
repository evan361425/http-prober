const { Socket } = require('net');
const CacheableLookup = require('cacheable-lookup');
const { randomBytes } = require('crypto');

/**
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
function fromEnvWithDefault(key, defaultValue) {
  const v = process.env['PROBER_' + key.toUpperCase()];
  return typeof v === 'string' && v.length !== 0 ? v : defaultValue;
}

/**
 *
 * @param {string} value
 * @returns {number}
 */
function s2i(value) {
  const ret = parseInt(value, 10);
  return isNaN(ret) ? 0 : ret;
}

function getHttpOptions() {
  const host = fromEnvWithDefault('http_host', 'localhost');
  const scheme = fromEnvWithDefault('http_scheme', 'http');
  const dPort = scheme === 'http' ? '80' : '443';
  const port = fromEnvWithDefault('http_port', dPort);
  const path = fromEnvWithDefault('http_path', '/');
  const method = fromEnvWithDefault('http_method', 'GET');
  const headers = fromEnvWithDefault(
    'http_headers',
    '{"user-agent": "prober"}'
  );
  const timeout = s2i(fromEnvWithDefault('http_timeout', '30'));

  const dns = new CacheableLookup.default({
    maxTtl: s2i(fromEnvWithDefault('dns_ttl', '300')),
  });

  return {
    host,
    port,
    path,
    timeout,
    method,
    lookup: dns.lookup,
    headers: JSON.parse(headers),
  };
}

function getHttpRequestor() {
  const scheme = fromEnvWithDefault('http_scheme', 'http');

  return scheme === 'https'
    ? require('https').request
    : require('http').request;
}

/**
 *
 * @param {bigint} startAt
 * @returns {number}
 */
function diffTiming(startAt) {
  const diff = process.hrtime.bigint() - startAt;
  const result = diff / BigInt(1e6);
  return result > 1 ? Number(result) : 0;
}

function log(id, action, timing) {
  const data = { id, action, timing };
  const msg = JSON.stringify({ prober: data });
  console.log(msg);
}

async function main() {
  const httpOptions = getHttpOptions();
  const requestor = getHttpRequestor();
  const body = fromEnvWithDefault('http_body', undefined);
  const isTiming = fromEnvWithDefault('response_is_timing', 'false') === 'true';
  let duration = s2i(fromEnvWithDefault('duration', '0'));
  let rate = s2i(fromEnvWithDefault('rate', '0'));

  function makeRequest() {
    return new Promise((resolve) => {
      const startAt = process.hrtime.bigint();
      const id = randomBytes(24).toString('hex');
      /**
       * @param {Socket} socket
       */
      function recordSocket(socket) {
        socket.on('lookup', () => log(id, 'dns', diffTiming(startAt)));
        socket.on('connect', () => log(id, 'tcp', diffTiming(startAt)));
        socket.on('secureConnect', () => log(id, 'tls', diffTiming(startAt)));
      }

      const req = requestor(httpOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          log(id, 'response', diffTiming(startAt));
          isTiming && log(id, 'exec', s2i(data));
          resolve();
        });
      }).on('error', (_err) => resolve());

      req.socket !== null
        ? recordSocket(req.socket, startAt)
        : req.on('socket', (socket) => recordSocket(socket, startAt));

      body !== undefined && req.write(body);

      req.end();
    });
  }

  if (rate === 0) {
    while (true) {
      await makeRequest();
      if (!--duration) break;
    }

    process.on('SIGINT', () => {
      duration = 1;
    });
  } else {
    const interval = setInterval(() => {
      --duration || clearInterval(interval);
      let count = rate;
      while (count--) makeRequest();
    }, 1000);

    process.on('SIGINT', () => {
      clearInterval(interval);
    });
  }
}

main().then(() => console.log('done'));
