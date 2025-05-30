export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    const body = await request.json();
    const { message, password } = body;
    if (!message) {
      return new Response(JSON.stringify({ error: '消息内容 required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const id = crypto.randomUUID();
    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    await env.MESSAGES.put(id, JSON.stringify({ message, hashedPassword, accessed: false }));
    const link = new URL(`/message/${id}`, new URL(request.url).origin).toString();
    return new Response(JSON.stringify({ link }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}