/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authentication module unified export entry
 *
 * Directory Structure:
 * - middleware/   : middleware layer for request validation and interception
 * - repository/   : data access layer for persistence and queries
 * - service/      : business-logic layer for core auth functionality
 */

// Middleware
export { AuthMiddleware } from './middleware/AuthMiddleware';
export { TokenMiddleware, TokenUtils, createAuthMiddleware } from './middleware/TokenMiddleware';
export type { TokenPayload } from './middleware/TokenMiddleware';

// Repository
export { UserRepository } from './repository/UserRepository';
export { RateLimitStore } from './repository/RateLimitStore';
export type { AuthUser } from './repository/UserRepository';

// Service
export { AuthService } from './service/AuthService';
