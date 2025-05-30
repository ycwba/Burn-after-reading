addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/' || path === '') {
    return handleIndex();
  } else if (path === '/create' && request.method === 'POST') {
    return handleCreate(request);
  } else if (path.startsWith('/message/')) {
    return handleMessage(request, url);
  } else {
    return new Response('Not found', { status: 404 });
  }
}

async function handleIndex() {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>阅后即焚</title>
</head>
<body>
  <h1>创建阅后即焚消息</h1>
  <form id="createForm">
    <label for="message">消息内容：</label><br>
    <textarea id="message" name="message" rows="4" cols="50" required></textarea><br>
    <label for="password">访问密码（可选）：</label><br>
    <input type="password" id="password" name="password"><br><br>
    <button type="submit">创建链接</button>
  </form>
  <div id="result"></div>
  <script>
    document.getElementById('createForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const response = await fetch('/create', {
        method: 'POST',
        body: JSON.stringify({
          message: formData.get('message'),
          password: formData.get('password')
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        document.getElementById('result').innerHTML = '<p>您的链接已创建： <a href=\"' + data.link + '\" target=\"_blank\">' + data.link + '</a></p>';
      } else {
        document.getElementById('result').innerHTML = '<p>创建失败。</p>';
      }
    });
  </script>
</body>
</html>
  `;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

async function handleCreate(request) {
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
  await MESSAGES.put(id, JSON.stringify({ message, hashedPassword, accessed: false }));
  const link = new URL(`/message/${id}`, new URL(request.url).origin).toString();
  return new Response(JSON.stringify({ link }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handleMessage(request, url) {
  const id = url.pathname.split('/').pop();
  const dataStr = await MESSAGES.get(id);
  if (!dataStr) {
    return new Response('Not found', { status: 404 });
  }
  let data = JSON.parse(dataStr);
  if (data.accessed) {
    await MESSAGES.delete(id);
    return new Response('Message already accessed or expired', { status: 403 });
  }
  if (request.method === 'GET') {
    const html = `
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>查看消息</title>
</head>
<body>
  <h1>输入密码查看消息</h1>
  <form method="POST">
    <input type="password" name="password" required>
    <button type="submit">提交</button>
  </form>
</body>
</html>
    `;
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
  } else if (request.method === 'POST') {
    const formData = await request.formData();
    const providedPassword = formData.get('password');
    if (data.hashedPassword) {
      const hashedProvided = await hashPassword(providedPassword);
      if (hashedProvided !== data.hashedPassword) {
        return new Response('Incorrect password', { status: 403 });
      }
    }
    // Access granted, show message and mark as accessed
    data.accessed = true;
    await MESSAGES.put(id, JSON.stringify(data));
    await MESSAGES.delete(id); // Delete after access to save space
    return new Response(data.message, { status: 200 });
  } else {
    return new Response('Method not allowed', { status: 405 });
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 注意：需要在Cloudflare仪表盘中绑定一个KV命名空间，命名为"MESSAGES"，用于存储消息数据。