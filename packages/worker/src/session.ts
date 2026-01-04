import { DurableObject } from 'cloudflare:workers';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class SessionDO extends DurableObject {
  private messages: Message[] = [];

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/messages':
        if (request.method === 'GET') {
          return Response.json({ messages: this.messages });
        }
        if (request.method === 'POST') {
          const message = await request.json() as Message;
          this.messages.push({ ...message, timestamp: Date.now() });
          return Response.json({ success: true });
        }
        break;
      case '/clear':
        if (request.method === 'POST') {
          this.messages = [];
          return Response.json({ success: true });
        }
        break;
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
}
