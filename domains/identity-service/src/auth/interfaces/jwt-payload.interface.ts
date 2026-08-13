/**
 * Shape of the JWTs issued by identity-service.
 *
 * Custom claims use snake_case per backend-conventions (JSON field names are
 * snake_case). Standard registered claims (`sub`, `exp`, `iat`, `iss`, `jti`)
 * keep their conventional names.
 *
 * Per ADR-001 the final token must also carry `account_id`, but accounts are
 * owned by accounts-service — identity-service cannot sign a claim it does not
 * own. The api-gateway will composite `account_id` when it validates the token
 * and forwards claims downstream.
 */
export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  /** user_id (ULID) — the JWT `sub` claim. */
  sub: string;
  /** Token kind: prevents a refresh token from being accepted as access. */
  type: TokenType;
  /** The AuthIdentity (provider credential) that authenticated the user. */
  auth_identity_id?: string;
  email?: string | null;
  locale?: string;
  /** Unique token id — binds the refresh JWT to its DB row (token_hash). */
  jti?: string;
  /** Rotation family identifier for refresh tokens. */
  family_id?: string;
}

/** A validated access-token request context (attached to `req.user`). */
export interface AccessTokenUser {
  userId: string;
  authIdentityId?: string;
  email?: string | null;
  locale?: string;
}

/** The result of issuing / rotating a token pair. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
