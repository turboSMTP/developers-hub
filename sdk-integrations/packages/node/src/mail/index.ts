/**
 * Mail module — the mail client, its request and result types, and the address
 * handling it needs, kept together.
 *
 * This file is the module's surface. Nothing outside `src/mail/` imports a file
 * inside it directly; `client.ts` and the package entry point import `./mail`.
 * `address.ts` and `inline-cid.ts` are mail concerns, not shared utilities —
 * that is why they live here rather than at `src/` root.
 */

export type { Address, AddressInput, AddressObject } from './address';
export type { Attachment, SendMessage, SendResult } from './mail';
export { MailNamespace } from './mail';
