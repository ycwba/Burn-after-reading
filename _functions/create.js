/**
 * 注意：部署前请在Cloudflare仪表盘中绑定KV命名空间，命名为"MESSAGES"。
 */
export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    const body = await request.json();
    const { message, password } = body;
    try {
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
    } catch (error) {
      if (error.message.includes('KV namespace not found')) {
        return new Response(JSON.stringify({ error: 'KV命名空间未找到，请在Cloudflare仪表盘中绑定"MESSAGES"命名空间' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: '服务器错误：' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
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