import type { GatewayConfig } from '../config/gateway.config';

interface CacheEntry {
  /** Resolved account id, or null when the user has no active membership. */
  accountId: string | null;
  expiresAt: number;
}

/**
 * Resolves the caller's active account from accounts-service and composites it
 * into the forwarded request as `x-account-id`.
 *
 * Why here: per ADR-001 every forwarded request must carry account context, but
 * identity-service never signs an `account_id` claim (accounts are owned by
 * accounts-service). The gateway therefore performs a synchronous internal read
 * (allowed — Critical Rule #2 permits direct calls for synchronous reads) and
 * caches it briefly to shield accounts-service.
 *
 * Failure isolation: if accounts-service is unavailable or not configured, the
 * resolution returns undefined (no header set) instead of throwing. Downstream
 * services that REQUIRE account context (farms) reject such requests with their
 * own explicit error; identity/account traffic is unaffected.
 */
export class AccountContextService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly config: GatewayConfig) {}

  /**
   * Resolves the active account id for a verified user id.
   * Returns undefined when it cannot be determined right now
   * (accounts unreachable / key not configured). Cached per user for
   * `accountContextCacheTtlMs`.
   */
  async resolveAccountId(userId: string): Promise<string | null | undefined> {
    const now = Date.now();
    const hit = this.cache.get(userId);
    if (hit && hit.expiresAt > now) {
      return hit.accountId;
    }

    let resolved: string | null | undefined;
    try {
      resolved = await this.fetchAccountId(userId);
    } catch {
      // Keep any still-fresh cached value; otherwise signal "unknown".
      return hit ? hit.accountId : undefined;
    }

    this.cache.set(userId, {
      accountId: resolved,
      expiresAt: now + this.config.accountContextCacheTtlMs,
    });
    // Opportunistic cleanup so the cache cannot grow unbounded.
    if (this.cache.size > 10_000) {
      const cutoff = now;
      for (const [key, entry] of this.cache) {
        if (entry.expiresAt <= cutoff) {
          this.cache.delete(key);
        }
      }
    }
    return resolved;
  }

  private async fetchAccountId(
    userId: string,
  ): Promise<string | null> {
    const key = this.config.internalServiceApiKey;
    if (!key) {
      throw new Error('INTERNAL_SERVICE_API_KEY is not configured');
    }
    const base = this.config.accountsServiceUrl.replace(/\/+$/, '');
    const res = await fetch(
      `${base}/internal/onboarding/users/${encodeURIComponent(userId)}/active-account`,
      {
        headers: { 'x-internal-service-key': key },
        signal: AbortSignal.timeout(2_000),
      },
    );
    if (!res.ok) {
      throw new Error(
        `accounts active-account lookup failed (status ${res.status})`,
      );
    }
    const body = (await res.json()) as { accountId?: string | null };
    return body.accountId ?? null;
  }
}
