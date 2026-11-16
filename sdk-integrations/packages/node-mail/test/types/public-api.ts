import { MailNamespace, type SendMessage, type SendResponse, type SendResult } from '../../dist/cjs';

const response: SendResponse = { mid: '9007199254740993', message: 'OK' };
const result: SendResult = { messageId: response.mid, raw: response };
const namespace = new MailNamespace(async (message: SendMessage) => {
  return new Response(JSON.stringify({ mid: result.messageId, message: message.subject }));
});
void namespace;

// @ts-expect-error The public response cannot expose a rounded numeric ID.
response.mid = 9007199254740992;
// @ts-expect-error A generated API object is not the namespace's public constructor contract.
new MailNamespace({ sendEmailRaw: async () => ({ raw: new Response('{}') }) });
