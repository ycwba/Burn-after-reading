import {
  getAssetFromKV,
  serveSinglePageApp,
} from '@cloudflare/kv-asset-handler';

// 绑定到你的 KV Namespace，名称需要与你在步骤 1 中创建的 Namespace 名称一致
const KV_NAMESPACE = SECRET_MESSAGES; // 替换为你的 KV Namespace 名称

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  const url = new URL(event.request.url);
  const path = url.pathname;

  // Route API requests to the Worker logic
  if (path.startsWith('/api/messages')) {
    return handleApiRequest(event.request);
  }

  // Serve static assets from Pages
  try {
    return await getAssetFromKV(event);
  } catch (e) {
    // If the asset is not found, serve the single page app (index.html)
    return serveSinglePageApp(event);
  }
}

// Worker logic (same as the standalone Worker code from step 3)
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle POST request to /api/messages (Save message)
    if (path === '/api/messages' && method === 'POST') {
      try {
        const { message } = await request.json();
        if (!message) {
          return new Response(JSON.stringify({ error: '消息内容不能为空。' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await KV_NAMESPACE.put(id, message, { expirationTtl: 60 * 60 * 24 * 7 });

        return new Response(JSON.stringify({ id: id }), { status: 201, headers: { 'Content-Type': 'application/json' } });

      } catch (e) {
        return new Response(JSON.stringify({ error: '处理请求时发生错误。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Handle GET request to /api/messages/:id (Retrieve and delete message)
    if (path.startsWith('/api/messages/') && method === 'GET') {
      const id = path.substring('/api/messages/'.length);

      try {
        const message = await KV_NAMESPACE.get(id);

        if (message === null) {
          return new Response(JSON.stringify({ error: '消息未找到或已销毁。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        await KV_NAMESPACE.delete(id);

        return new Response(JSON.stringify({ message: message }), { status: 200, headers: { 'Content-Type': 'application/json' } });

      } catch (e) {
        return new Response(JSON.stringify({ error: '处理请求时发生错误。' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

     return new Response(JSON.stringify({ error: '未找到。' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
}
