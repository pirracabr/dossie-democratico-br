import dns from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Converte endereço IPv4 em número inteiro de 32 bits sem sinal para verificação de CIDR.
 * @param {string} ip
 * @returns {number}
 */
function ipv4ToInt(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + Number.parseInt(octet, 10)) >>> 0, 0);
}

/**
 * Verifica se um endereço IPv4 está contido em um bloco CIDR.
 * @param {string} ip
 * @param {string} cidr
 * @returns {boolean}
 */
function isIPv4InCidr(ip, cidr) {
  const [range, bitsStr] = cidr.split('/');
  const bits = Number.parseInt(bitsStr, 10);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  return (ipInt & mask) === (rangeInt & mask);
}

// Faixas IPv4 proibidas (Loopback, RFC 1918, Link-Local/Cloud Metadata, Multicast, CGNAT, etc.)
const BLOCKED_IPV4_CIDRS = [
  '0.0.0.0/8',       // "This host on this network"
  '10.0.0.0/8',      // Private network
  '100.64.0.0/10',   // Carrier-grade NAT
  '127.0.0.0/8',     // Loopback
  '169.254.0.0/16',  // Link-local / Cloud metadata (AWS, GCP, Azure, DigitalOcean)
  '172.16.0.0/12',   // Private network
  '192.0.0.0/24',    // IETF Protocol Assignments
  '192.0.2.0/24',    // Documentation (TEST-NET-1)
  '192.88.99.0/24',  // 6to4 Relay Anycast
  '192.168.0.0/16',  // Private network
  '198.18.0.0/15',   // Benchmark testing
  '198.51.100.0/24', // Documentation (TEST-NET-2)
  '203.0.113.0/24',  // Documentation (TEST-NET-3)
  '224.0.0.0/4',     // Multicast
  '240.0.0.0/4',     // Reserved
  '255.255.255.255/32' // Broadcast
];

/**
 * Verifica se um endereço IPv6 é reservado ou privado.
 * @param {string} ip
 * @returns {boolean}
 */
function isBlockedIPv6(ip) {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // Unique Local (fc00::/7)
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true; // Link-Local (fe80::/10)
  if (normalized.startsWith('::ffff:')) {
    // IPv4-mapped IPv6
    const ipv4Part = normalized.replace('::ffff:', '');
    if (isIP(ipv4Part) === 4) {
      return isBlockedIPv4(ipv4Part);
    }
    return true;
  }
  return false;
}

/**
 * Avalia se o IPv4 é proibido.
 * @param {string} ip
 * @returns {boolean}
 */
export function isBlockedIPv4(ip) {
  return BLOCKED_IPV4_CIDRS.some(cidr => isIPv4InCidr(ip, cidr));
}

/**
 * Validação rigorosa de URL contra ataques de SSRF.
 * @param {string} rawUrl
 * @param {object} [options]
 * @param {Function} [options.dnsLookup] - Injetor opcional para mock em testes
 * @returns {Promise<{ safe: boolean, error?: string, parsedUrl?: URL, resolvedIps?: string[] }>}
 */
export async function validateUrlSafe(rawUrl, options = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    return { safe: false, error: `URL inválida ou malformada: ${rawUrl}` };
  }

  // 1. Restrição estrita de Protocolo
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, error: `Protocolo proibido: "${parsed.protocol}". Apenas http e https são autorizados.` };
  }

  // 2. Restrição de Portas
  const port = parsed.port ? Number.parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  if (![80, 443].includes(port)) {
    return { safe: false, error: `Porta não autorizada: ${port}. Somente 80 e 443 são permitidas.` };
  }

  // 3. Proibir credenciais no formato http://user:pass@host
  if (parsed.username || parsed.password) {
    return { safe: false, error: 'Credenciais na URL (user:pass) são proibidas.' };
  }

  const hostname = parsed.hostname;

  // 4. Bloqueio imediato de hostnames literais perigosos
  if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname.toLowerCase())) {
    return { safe: false, error: `Acesso a hostname local rejeitado: ${hostname}` };
  }

  // 5. Se o hostname já for um IP direto, validar sem consulta DNS
  const ipType = isIP(hostname);
  if (ipType === 4) {
    if (isBlockedIPv4(hostname)) {
      return { safe: false, error: `Endereço IPv4 bloqueado (Privado/Link-Local): ${hostname}` };
    }
    return { safe: true, parsedUrl: parsed, resolvedIps: [hostname] };
  }

  if (ipType === 6) {
    if (isBlockedIPv6(hostname)) {
      return { safe: false, error: `Endereço IPv6 bloqueado (Privado/Link-Local): ${hostname}` };
    }
    return { safe: true, parsedUrl: parsed, resolvedIps: [hostname] };
  }

  // 6. Resolução DNS antecipada para mitigar DNS Rebinding e SSRF
  const lookupFn = options.dnsLookup || (async (host) => {
    return await dns.lookup(host, { all: true });
  });

  try {
    const addresses = await lookupFn(hostname);
    if (!addresses || addresses.length === 0) {
      return { safe: false, error: `Não foi possível resolver o hostname: ${hostname}` };
    }

    const resolvedIps = [];
    for (const record of addresses) {
      const address = record.address;
      resolvedIps.push(address);

      if (record.family === 4 && isBlockedIPv4(address)) {
        return {
          safe: false,
          error: `O domínio ${hostname} resolve para o IP privado/bloqueado ${address}. Requisição abortada.`
        };
      }

      if (record.family === 6 && isBlockedIPv6(address)) {
        return {
          safe: false,
          error: `O domínio ${hostname} resolve para o IPv6 reservado/bloqueado ${address}. Requisição abortada.`
        };
      }
    }

    return { safe: true, parsedUrl: parsed, resolvedIps };
  } catch (dnsErr) {
    return { safe: false, error: `Falha na resolução de DNS para ${hostname}: ${dnsErr.message}` };
  }
}
