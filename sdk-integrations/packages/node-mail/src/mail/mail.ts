/**
 * Mail namespace — `client.mail.send(...)`.
 *
 * This is the curated Layer 2 surface: idiomatic arrays for recipients, `text`/
 * `html` bodies, a first-class `replyTo`, byte attachments (base64 is handled for
 * the developer), and a stringified `messageId`. It maps onto the generated
 * Layer 1 `MailMessage` wire model and hides the dual-auth entirely.
 */

import { ApiError, TurboSMTPError, toTurboSMTPError } from '../errors';
import { type MailMessage, ResponseError, type Attachment as WireAttachment } from '../generated/src';
import {
  type Address,
  type AddressInput,
  formatAddress,
  joinAddresses,
  joinRecipients,
  rejectLineBreaks,
  senderDomain,
} from './address';
import { qualifyInlineCids } from './inline-cid';

/** A file attached to an email. `content` is raw bytes — the SDK base64-encodes it. */
export interface Attachment {
  content: Uint8Array | ArrayBuffer;
  filename: string;
  contentType: string;
  /** Optional CID for referencing an embedded image from HTML (`<img src="cid:...">`). */
  contentId?: string;
}

/** The message to send. `from` and `to` are required; everything else is optional. */
export interface SendMessage {
  from: Address;
  to: AddressInput;
  cc?: AddressInput;
  bcc?: AddressInput;
  subject?: string;
  /** Plain-text body. */
  text?: string;
  /** HTML body. */
  html?: string;
  /** Reply-To header. Supply one address: the API retains only the first in a list. */
  replyTo?: AddressInput;
  /** Additional custom headers. An explicit `replyTo` wins over a `reply-to` key here. */
  headers?: Record<string, string>;
  attachments?: Attachment[];
  /** Echoed back in the Event Webhook. */
  referenceId?: string;
  /** Campaign identifier. */
  campaignId?: string;
  /** Raw MIME that replaces `text` + `html`. */
  mimeRaw?: string;
}

/** Checked success fields owned by the facade, with an exact string identifier. */
export interface SendResponse {
  mid: string;
  message?: string;
}

/** Result of a successful send. */
export interface SendResult {
  /** The exact message id (`mid`), never a rounded JavaScript number. */
  messageId: string;
  /** Checked success fields. Unknown wire fields are omitted. */
  raw?: SendResponse;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base64-encode bytes without Buffer/atob — works in Node and the browser. */
function bytesToBase64(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? B64[b2 & 0x3f] : '=';
  }
  return out;
}

/**
 * Merge custom headers with an explicit `replyTo` (replyTo wins). The pairs land in
 * MIME headers verbatim, so a line break in a name or a value is header injection
 * exactly as it is in an address.
 */
function buildCustomHeaders(msg: SendMessage): { [key: string]: string } | undefined {
  const headers: { [key: string]: string } = { ...(msg.headers ?? {}) };
  for (const [name, value] of Object.entries(headers)) {
    rejectLineBreaks(name, 'A header name');
    rejectLineBreaks(value, 'A header value');
  }
  if (msg.replyTo != null) {
    // Header names are case-insensitive, so any existing spelling has to go first;
    // otherwise both survive and the message goes out with two Reply-To headers.
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'reply-to') delete headers[key];
    }
    headers['reply-to'] = joinAddresses(msg.replyTo);
  }
  return Object.keys(headers).length > 0 ? headers : undefined;
}

function toWireAttachment(a: Attachment): WireAttachment {
  return {
    content: bytesToBase64(a.content),
    name: a.filename,
    type: a.contentType,
    contentId: a.contentId,
  };
}

/**
 * The HTML body with every inline `cid:` reference qualified by the sender domain.
 * Returns the body untouched when there is nothing to qualify.
 */
function toHtmlContent(msg: SendMessage): string | undefined {
  if (msg.html == null || !msg.attachments?.length) {
    return msg.html;
  }
  const ids = msg.attachments
    .map((attachment) => attachment.contentId)
    .filter((id): id is string => id != null);
  const domain = ids.length === 0 ? undefined : senderDomain(msg.from);
  return domain == null ? msg.html : qualifyInlineCids(msg.html, ids, domain);
}

/**
 * Guard a required field.
 *
 * The types mark `from` and `to` required, but the package ships CJS/ESM to
 * JavaScript callers who get no such check. Without this they fault inside
 * `formatAddress` with a `TypeError` naming an internal property, outside the
 * typed hierarchy this SDK promises. An empty `to` array is left alone: the
 * server rejects it with a 400.
 */
function required<T>(value: T | null | undefined, field: string): T {
  if (value == null) {
    throw new TurboSMTPError(`\`${field}\` is required.`);
  }
  return value;
}

/** Map the facade message onto the generated `MailMessage`. */
export function toMailMessage(msg: SendMessage): MailMessage {
  return {
    from: formatAddress(required(msg.from, 'from')),
    to: joinRecipients(required(msg.to, 'to')),
    cc: msg.cc == null ? undefined : joinRecipients(msg.cc),
    bcc: msg.bcc == null ? undefined : joinRecipients(msg.bcc),
    subject: msg.subject,
    content: msg.text,
    htmlContent: toHtmlContent(msg),
    customHeaders: buildCustomHeaders(msg),
    referenceId: msg.referenceId,
    xCampaignID: msg.campaignId,
    mimeRaw: msg.mimeRaw,
    attachments: msg.attachments?.map(toWireAttachment),
  };
}

/** Convert a JSON number token without ever rounding it through a JS number. */
function integerToken(source: string): string | undefined {
  const [coefficient, exponent = '0'] = source.toLowerCase().split('e');
  const [whole, fraction = ''] = coefficient.split('.');
  let digits = whole.replace('-', '') + fraction;
  if (/^0+$/.test(digits)) return '0';
  const scale = Number(exponent) - fraction.length;
  if (scale < 0) {
    const end = Math.max(0, digits.length + scale);
    if (!/^0*$/.test(digits.slice(end))) return undefined;
    digits = digits.slice(0, end) || '0';
  } else {
    digits += '0'.repeat(scale);
  }
  return BigInt((whole.startsWith('-') ? '-' : '') + digits).toString();
}

function parseSendResponse(rawText: string, status: number): SendResponse {
  const invalid = () =>
    new ApiError('Invalid send response; the send outcome is uncertain. Do not resend automatically.', {
      status,
      raw: rawText,
    });
  // Node 22+ supplies the original number token to the reviver, before precision is lost.
  const sources = new WeakMap<object, string>();
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      rawText,
      function (this: object, key: string, value: unknown, context?: { source?: string }) {
        if (key === 'mid' && typeof value === 'number' && context?.source) sources.set(this, context.source);
        return value;
      },
    );
  } catch {
    throw invalid();
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed) ||
    !('mid' in parsed) ||
    !Object.getOwnPropertyDescriptor(parsed, 'mid')
  ) {
    throw invalid();
  }
  const message = 'message' in parsed ? parsed.message : undefined;
  if (message !== undefined && typeof message !== 'string') throw invalid();
  const mid = parsed.mid;
  let messageId: string | undefined;
  if (typeof mid === 'string' && /^-?\d+$/.test(mid)) {
    messageId = mid;
  } else if (typeof mid === 'number' && Number.isFinite(mid)) {
    const source = sources.get(parsed);
    messageId = source ? integerToken(source) : Number.isSafeInteger(mid) ? String(mid) : undefined;
  }
  if (messageId === undefined) throw invalid();
  return message === undefined ? { mid: messageId } : { mid: messageId, message };
}

export class MailNamespace {
  constructor(private readonly sendRequest: (message: SendMessage) => Promise<Response>) {}

  /** Send an email. Resolves with the `messageId`; throws a typed `TurboSMTPError` on failure. */
  async send(message: SendMessage): Promise<SendResult> {
    try {
      const response = await this.sendRequest(message);
      if (!response.ok) throw new ResponseError(response);
      let rawText: string;
      try {
        rawText = await response.text();
      } catch (cause) {
        throw new ApiError(
          'Cannot read send response; the send outcome is uncertain. Do not resend automatically.',
          {
            status: response.status,
            cause,
          },
        );
      }
      const raw = parseSendResponse(rawText, response.status);
      return { messageId: raw.mid, raw };
    } catch (err) {
      throw await toTurboSMTPError(err);
    }
  }
}
