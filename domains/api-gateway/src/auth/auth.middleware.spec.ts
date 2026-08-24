import type { NextFunction, Request, Response } from 'express';
import { createAuthMiddleware } from './auth.middleware';
import { JwtVerifier, type AccessTokenPayload } from './jwt-verifier.service';
import { AccountContextService } from './account-context.service';
import { testGatewayConfig } from '../config/gateway.config.spec-util';

describe('auth middleware (account context forwarding)', () => {
  const userId = '01J8Z0000000000000000000ABCD';
  const accountId = '01J8A0000000000000000000ABCD';
  const token = 'valid-token';

  let req: Request;
  let res: Response;
  let next: NextFunction;
  let verifier: JwtVerifier;
  let accountContext: AccountContextService;

  function callMiddleware(): Promise<void> {
    const handler = createAuthMiddleware(testGatewayConfig(), verifier, accountContext);
    return handler(req, res, next);
  }

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/v1/farms',
      headers: {},
    } as unknown as Request;
    req.headers.authorization = `Bearer ${token}`;

    res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    next = jest.fn();

    verifier = new JwtVerifier(testGatewayConfig());
    jest.spyOn(verifier, 'verifyAccessToken').mockResolvedValue({
      sub: userId,
      type: 'access',
      onboarding_completed: true,
    } satisfies AccessTokenPayload);

    accountContext = new AccountContextService(testGatewayConfig());
    jest.spyOn(accountContext, 'resolveAccountId');
  });

  function setPath(path: string): void {
    (req as Request & { path: string }).path = path;
  }

  it('forwards the resolved x-account-id for protected routes', async () => {
    jest
      .spyOn(accountContext, 'resolveAccountId')
      .mockResolvedValue(accountId);

    await callMiddleware();

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.headers['x-account-id']).toBe(accountId);
    expect(req.headers['x-user-id']).toBe(userId);
  });

  it('strips client-supplied x-account-id before forwarding', async () => {
    req.headers['x-account-id'] = 'spoofed-account-id';
    jest
      .spyOn(accountContext, 'resolveAccountId')
      .mockResolvedValue(accountId);

    await callMiddleware();

    expect(req.headers['x-account-id']).toBe(accountId);
  });

  it('leaves x-account-id unset when resolution is unavailable', async () => {
    jest.spyOn(accountContext, 'resolveAccountId').mockResolvedValue(undefined);

    await callMiddleware();

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.headers['x-account-id']).toBeUndefined();
  });

  it('does not resolve accounts for public paths', async () => {
    setPath('/api/v1/auth/login');
    const resolveSpy = jest
      .spyOn(accountContext, 'resolveAccountId')
      .mockResolvedValue(accountId);

    await callMiddleware();

    expect(resolveSpy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects requests without a bearer token before touching accounts', async () => {
    delete req.headers.authorization;
    const resolveSpy = jest
      .spyOn(accountContext, 'resolveAccountId')
      .mockResolvedValue(accountId);

    await callMiddleware();

    expect(resolveSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
