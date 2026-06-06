/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import type { IncomingMessage } from 'http';
import * as cookie from 'cookie';
import { AuthService } from '../service/AuthService';
import { UserRepository } from '../repository/UserRepository';
import { AUTH_CONFIG } from '../../config/constants';

/**
 * Token payload interface
 */
export interface TokenPayload {
  userId: string;
  username: string;
}

/**
 * Token Extractor - Extract authentication token from request
 *
 * Security: URL query token is no longer supported to prevent token leakage via logs, Referrer, etc.
 */
class TokenExtractor {
  /**
   * Extract token from request, supporting these sources:
   * 1. Authorization header (Bearer token)
   * 2. Cookie (wayland-session)
   *
   * @param req - Express request object
   * @returns Token string or null
   */
  static extract(req: Request): string | null {
    // 1. Try to extract from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. Try to extract from Cookie
    if (typeof req.cookies === 'object' && req.cookies) {
      const cookieToken = req.cookies[AUTH_CONFIG.COOKIE.NAME];
      if (typeof cookieToken === 'string' && cookieToken.trim() !== '') {
        return cookieToken;
      }
    }

    // URL query token is no longer supported (security risk)

    return null;
  }
}

/**
 * Validation Strategy Interface - Define unauthorized handling
 */
interface ValidationStrategy {
  handleUnauthorized(res: Response): void;
}

/**
 * JSON Validation Strategy - Return JSON format error response
 */
class JsonValidationStrategy implements ValidationStrategy {
  handleUnauthorized(res: Response): void {
    res.status(403).json({ success: false, error: 'Access denied. Please login first.' });
  }
}

/**
 * HTML Validation Strategy - Return HTML format error response
 */
class HtmlValidationStrategy implements ValidationStrategy {
  handleUnauthorized(res: Response): void {
    res.status(403).send('Access Denied');
  }
}

/**
 * Validator Factory - Create validation strategy based on type
 */
class ValidatorFactory {
  /**
   * Create validation strategy
   * @param type - Strategy type (json or html)
   * @returns Validation strategy instance
   */
  static create(type: 'json' | 'html'): ValidationStrategy {
    if (type === 'html') {
      return new HtmlValidationStrategy();
    }
    return new JsonValidationStrategy();
  }
}

/**
 * Create authentication middleware
 *
 * This middleware performs the following steps:
 * 1. Extract token from request
 * 2. Verify token validity
 * 3. Find user information
 * 4. Attach user info to request object
 *
 * @param type - Response type (json or html)
 * @returns Express middleware function
 */
export const createAuthMiddleware = (type: 'json' | 'html' = 'json') => {
  const strategy = ValidatorFactory.create(type);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Extract token
    const token = TokenExtractor.extract(req);

    if (!token) {
      strategy.handleUnauthorized(res);
      return;
    }

    // 2. Verify token
    const decoded = await AuthService.verifyToken(token);
    if (!decoded) {
      strategy.handleUnauthorized(res);
      return;
    }

    // 3. Find user
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      strategy.handleUnauthorized(res);
      return;
    }

    // 4. Attach user info to request object
    req.user = {
      id: user.id,
      username: user.username,
    };

    next();
  };
};

/**
 * Token Utils - Provide token related helper methods
 */
export const TokenUtils = {
  /**
   * Extract token from request
   * @param req - Express request object
   * @returns Token string or null
   */
  extractFromRequest(req: Request): string | null {
    return TokenExtractor.extract(req);
  },
};

/**
 * TokenMiddleware Utility - Provides unified token authentication interface
 */
export const TokenMiddleware = {
  /** Extract token from request */
  extractToken(req: Request): string | null {
    return TokenExtractor.extract(req);
  },

  /** Verify token validity */
  async isTokenValid(token: string | null): Promise<boolean> {
    return Boolean(token && (await AuthService.verifyToken(token)));
  },

  /** Return auth middleware (JSON response by default) */
  validateToken(options?: {
    responseType?: 'json' | 'html';
  }): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return createAuthMiddleware(options?.responseType ?? 'json');
  },

  /**
   * Extract token from WebSocket request
   *
   * Security: URL query token is no longer supported to prevent token leakage via logs, Referrer, etc.
   */
  extractWebSocketToken(req: IncomingMessage): string | null {
    // 1. Extract from Authorization header
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. Extract from Cookie (WebUI mode)
    const cookieHeader = req.headers['cookie'];
    if (typeof cookieHeader === 'string') {
      const cookies = cookie.parse(cookieHeader);
      const cookieToken = cookies[AUTH_CONFIG.COOKIE.NAME];
      if (cookieToken) {
        return cookieToken;
      }
    }

    // 3. Extract from sec-websocket-protocol (for clients that don't support Cookies)
    const protocolHeader = req.headers['sec-websocket-protocol'];
    if (typeof protocolHeader === 'string' && protocolHeader.trim() !== '') {
      return protocolHeader.split(',')[0]?.trim() ?? null;
    }

    // URL query token is no longer supported (security risk)

    return null;
  },

  /** Validate WebSocket token */
  async validateWebSocketToken(token: string | null): Promise<boolean> {
    return Boolean(token && (await AuthService.verifyWebSocketToken(token)));
  },
};
