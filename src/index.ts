/// <reference types="@cloudflare/workers-types" />

// Define the fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle message creation (POST /create)
    if (path === '/create' && method === 'POST') {
      try {
        const { message, password } = await request.json();
        if (!message) {
          return new Response('Message content is required', { status: 400 });
        }

        const id = crypto.randomUUID();
        const messageData = { message, password };

        await env.MESSAGES.put(id, JSON.stringify(messageData));

        return new Response(JSON.stringify({ id }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error creating message:', error);
        return new Response('Error creating message', { status: 500 });
      }
    }

    // Handle message retrieval (GET /message/:id)
    if (path.startsWith('/message/') && method === 'GET') {
      try {
        const id = path.substring('/message/'.length);
        if (!id) {
             return new Response('Message ID is required', { status: 400 });
        }

        const messageDataString = await env.MESSAGES.get(id);

        if (!messageDataString) {
          return new Response('Message not found or already viewed', { status: 404 });
        }

        const messageData = JSON.parse(messageDataString);
        const { message, password } = messageData;

        // Check password if required
        if (password) {
          const providedPassword = url.searchParams.get('password');

          if (providedPassword !== password) {
            return new Response('Incorrect password', { status: 401 });
          }
        }

        // Delete the message after successful retrieval
        await env.MESSAGES.delete(id);

        return new Response(JSON.stringify({ message }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error retrieving message:', error);
        return new Response('Error retrieving message', { status: 500 });
      }
    }

    // For all other requests, return 404.
    // Cloudflare Pages will serve static assets from the 'public' directory.
    return new Response('Not Found', { status: 404 });
  },
};

// Define Env interface for type safety with KV binding
interface Env {
  MESSAGES: KVNamespace;
}