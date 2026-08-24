import { AccountContextService } from './account-context.service';
import { testGatewayConfig } from '../config/gateway.config.spec-util';

describe('AccountContextService', () => {
  const userId = '01J8Z0000000000000000000ABCD';
  const accountId = '01J8A0000000000000000000ABCD';

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  function serviceWithFetch(
    impl: () => Promise<Response>,
    overrides = {},
  ): AccountContextService {
    const svc = new AccountContextService(testGatewayConfig(overrides));
    jest.spyOn(global, 'fetch').mockImplementation(impl);
    return svc;
  }

  it('returns the resolved account id from accounts-service', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ accountId }), { status: 200 }),
    );
    const svc = new AccountContextService(testGatewayConfig());
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

    await expect(svc.resolveAccountId(userId)).resolves.toBe(accountId);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `http://accounts.test/internal/onboarding/users/${userId}/active-account`,
    );
    expect((init.headers as Record<string, string>)[
      'x-internal-service-key'
    ]).toBe('test-internal-key');
  });

  it('caches per user and does not call accounts again within the TTL', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ accountId }), { status: 200 }),
    );
    const svc = new AccountContextService(
      testGatewayConfig({ accountContextCacheTtlMs: 1_000 }),
    );
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

    await svc.resolveAccountId(userId);
    await svc.resolveAccountId(userId);
    await svc.resolveAccountId(userId);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('expires cached entries after the TTL and re-fetches', async () => {
    jest.useFakeTimers();
    let now = Date.now();
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ accountId }), { status: 200 }),
    );
    const svc = new AccountContextService(
      testGatewayConfig({ accountContextCacheTtlMs: 1_000 }),
    );
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

    void dateSpy;
    await svc.resolveAccountId(userId); // fetch #1
    now += 999;
    await svc.resolveAccountId(userId); // cached
    now += 2; // past TTL
    await svc.resolveAccountId(userId); // fetch #2

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('caches a null resolution (no active membership) without refetching', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ accountId: null }), { status: 200 }),
    );
    const svc = new AccountContextService(testGatewayConfig());
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

    await expect(svc.resolveAccountId(userId)).resolves.toBeNull();
    await expect(svc.resolveAccountId(userId)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns undefined (not a throw) when accounts-service is down', async () => {
    const svc = serviceWithFetch(() => Promise.reject(new Error('ECONNREFUSED')));
    await expect(svc.resolveAccountId(userId)).resolves.toBeUndefined();
  });

  it('returns undefined on non-200 responses', async () => {
    const svc = serviceWithFetch(() =>
      Promise.resolve(new Response('nope', { status: 503 })),
    );
    await expect(svc.resolveAccountId(userId)).resolves.toBeUndefined();
  });

  it('falls back to a still-fresh cached value when a later refresh fails', async () => {
    jest.useFakeTimers();
    let now = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    let healthy = true;
    const fetchMock = jest.fn().mockImplementation(() =>
      healthy
        ? Promise.resolve(new Response(JSON.stringify({ accountId }), { status: 200 }))
        : Promise.reject(new Error('boom')),
    );
    const svc = new AccountContextService(
      testGatewayConfig({ accountContextCacheTtlMs: 1_000 }),
    );
    jest.spyOn(global, 'fetch').mockImplementation(fetchMock);

    await svc.resolveAccountId(userId); // ok
    now += 1_001; // TTL expired → refresh needed
    healthy = false;
    await expect(svc.resolveAccountId(userId)).resolves.toBe(accountId);
  });
});
