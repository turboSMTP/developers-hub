/**
 * @turbosmtp/sdk — public entry point.
 *
 * Layer 2 (curated facade). The generated Layer 1 lives under `./generated` and
 * is intentionally NOT re-exported here — only the contracted surface is public.
 */

export type { Region, TurboSMTPClientOptions } from './client';
export { TurboSMTPClient } from './client';
export type { TurboSMTPErrorInit } from './errors';
export {
  ApiError,
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  TurboSMTPError,
  ValidationError,
} from './errors';
export type { Address, AddressInput, AddressObject, Attachment, SendMessage, SendResult } from './mail';
export { MailNamespace } from './mail';
