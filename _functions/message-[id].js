export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop(); // Get the id from the path
    const dataStr = await env.MESSAGES.get(id);
    if (!dataStr) {
      return new Response('Not found', { status: 404 });
    }
    let data = JSON.parse(dataStr);
    if (data.accessed) {
      await env.MESSAGES.delete(id);
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
      await env.MESSAGES.put(id, JSON.stringify(data));
      await env.MESSAGES.delete(id); // Delete after access
      return new Response(data.message, { status: 200 });
    } else {
      return new Response('Method not allowed', { status: 405 });
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