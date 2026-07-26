import { promises as dns } from 'dns'

// Blocklist of private / link-local / loopback ranges. If a user-supplied URL
// resolves into any of these, we refuse to fetch it — otherwise the server
// becomes an SSRF proxy for whoever pasted the URL.
//
// Coverage: IPv4 loopback, RFC1918, link-local (169.254.x — includes cloud
// metadata), CGNAT, IPv6 loopback / ULA / link-local.
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) return true
  const [a, b] = parts
  if (a === 10) return true                                 // 10.0.0.0/8
  if (a === 127) return true                                // loopback
  if (a === 172 && b >= 16 && b <= 31) return true          // 172.16.0.0/12
  if (a === 192 && b === 168) return true                   // 192.168.0.0/16
  if (a === 169 && b === 254) return true                   // link-local + AWS/GCP metadata
  if (a === 100 && b >= 64 && b <= 127) return true         // 100.64.0.0/10 (CGNAT)
  if (a === 0) return true                                  // 0.0.0.0/8
  if (a >= 224) return true                                 // multicast + reserved
  return false
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true                  // unspecified / loopback
  if (lower.startsWith('fe80:')) return true                          // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true   // fc00::/7 unique local
  if (lower.startsWith('ff')) return true                             // multicast
  // IPv4-mapped (::ffff:a.b.c.d) — check the embedded IPv4
  const m = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (m) return isPrivateIpv4(m[1])
  return false
}

/**
 * Validate a URL is safe to fetch from a server context (SSRF guard).
 * Rejects: non-http(s), non-standard ports, hostnames that resolve to
 * private/loopback/link-local addresses.
 */
export async function isSafePublicUrl(input: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  let url: URL
  try { url = new URL(input) } catch { return { ok: false, reason: 'Invalid URL' } }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http(s) URLs are allowed' }
  }

  // Reject explicit non-standard ports — narrows the SSRF surface.
  if (url.port && !['80', '443', '8080'].includes(url.port)) {
    return { ok: false, reason: 'Non-standard ports are not allowed' }
  }

  const host = url.hostname
  // If the host is a literal IP, block private ranges directly.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return isPrivateIpv4(host) ? { ok: false, reason: 'Private/loopback address blocked' } : { ok: true }
  }
  if (host.includes(':')) {
    return isPrivateIpv6(host) ? { ok: false, reason: 'Private/loopback address blocked' } : { ok: true }
  }

  // Hostname → resolve all A/AAAA records. If ANY resolves to a private
  // address, refuse — attacker DNS-rebinding to an internal IP is enough.
  try {
    const records = await dns.lookup(host, { all: true })
    for (const { address, family } of records) {
      if (family === 4 && isPrivateIpv4(address)) {
        return { ok: false, reason: 'Host resolves to a private address' }
      }
      if (family === 6 && isPrivateIpv6(address)) {
        return { ok: false, reason: 'Host resolves to a private address' }
      }
    }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'Could not resolve host' }
  }
}
