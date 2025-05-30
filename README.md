# 阅后即焚网站

这是一个简单的阅后即焚网站，允许用户创建在一次查看后即销毁的秘密消息。用户可以选择为消息设置访问密码。本项目设计为部署在 Cloudflare Pages (前端) 和 Cloudflare Workers (后端) 上。

## 文件结构

- `index.html`: 前端 HTML 结构。
- `style.css`: 前端 CSS 样式。
- `script.js`: 前端 JavaScript 逻辑，处理用户交互和与 Worker 的通信。
- `worker.js`: Cloudflare Worker 脚本，处理消息的创建、存储 (在 KV 中)、密码验证和一次性读取。

## 部署步骤

### 1. Cloudflare KV (键值存储) 设置

   - 登录到您的 Cloudflare Dashboard。
   - 导航到 "Workers & Pages" -> "KV"。
   - 点击 "Create a namespace"。
   - 给您的命名空间取一个名字，例如 `burn_after_reading_messages`。
   - 创建后，记下这个命名空间的名称。

### 2. 部署 Cloudflare Worker (`worker.js`)

   - 在 Cloudflare Dashboard 中，导航到 "Workers & Pages"。
   - 点击 "Create application"，然后选择 "Create Worker"。
   - 给您的 Worker 取一个名字 (例如 `burn-after-reading-api`) 并选择一个子域名。
   - 点击 "Deploy"。
   - 部署完成后，点击 "Configure Worker" 或 "Edit code"。
   - 将 [`worker.js`](worker.js:1) 文件的内容复制并粘贴到 Cloudflare Worker 编辑器中。
   - **重要**:
     - 转到 Worker 的 "Settings" -> "Variables"。
     - 在 "KV Namespace Bindings" 部分，点击 "Add binding"。
     - **Variable name**: 输入 `BURN_MESSAGES_KV` (这必须与 [`worker.js`](worker.js:5) 中使用的绑定名称完全匹配)。
     - **KV namespace**: 选择您在步骤 1 中创建的 KV 命名空间。
     - 点击 "Save and deploy"。
   - 部署成功后，Cloudflare 会提供一个 Worker URL (例如 `https://your-worker-name.your-subdomain.workers.dev`)。**复制此 URL。**

### 3. 配置并部署前端 (Cloudflare Pages)

   - 打开前端的 [`script.js`](script.js:1) 文件。
   - 找到以下行：
     ```javascript
     const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL_HERE'; // 占位符
     ```
   - 将 `'YOUR_CLOUDFLARE_WORKER_URL_HERE'` 替换为您在步骤 2 中获得的实际 Cloudflare Worker URL。确保 URL 两侧有引号。例如：
     ```javascript
     const WORKER_URL = 'https://burn-after-reading-api.your-username.workers.dev';
     ```
   - 保存 [`script.js`](script.js:1) 文件。
   - **部署到 Cloudflare Pages**:
     - 您可以将 `index.html`, `style.css`, 和更新后的 `script.js` 文件上传到 GitHub (或其他支持的 Git 提供商) 仓库。
     - 在 Cloudflare Dashboard 中，导航到 "Workers & Pages"。
     - 点击 "Create application"，然后选择 "Pages"。
     - 连接您的 Git 提供商并选择包含这些文件的仓库。
     - 配置构建设置 (对于纯静态站点，通常不需要特殊配置，Cloudflare Pages 会自动检测)。
     - 点击 "Save and Deploy"。
     - 部署完成后，Cloudflare Pages 会提供一个访问您网站的 URL。

### 4. (可选) 改进和安全注意事项

   - **CORS**: 在 [`worker.js`](worker.js:14) 中，`Access-Control-Allow-Origin` 设置为 `*` 以方便开发。在生产环境中，应将其更改为您的 Cloudflare Pages 域名，以增强安全性。
     ```javascript
     // 在 worker.js 中
     const corsHeaders = {
         'Access-Control-Allow-Origin': 'https://your-pages-project.pages.dev', // 替换为您的实际 Pages 域名
         // ... 其他头部
     };
     ```
   - **密码处理**: 当前 [`worker.js`](worker.js:34) 中的密码处理非常基础且不安全 (直接存储或简单比较)。在生产环境中，应考虑：
     - **客户端加密**: 在消息发送到 Worker 之前，在用户的浏览器中使用 JavaScript (例如 `SubtleCrypto` API) 对消息本身进行加密。密码仅用于派生加密密钥，并且永远不会发送到服务器。
     - **服务器端强哈希**: 如果必须在服务器端处理密码（例如，用于访问控制而不是直接加密数据），请使用像 Argon2 或 bcrypt 这样的强哈希算法。这在 Cloudflare Workers 中可能需要引入 WebAssembly 模块。
   - **错误处理和日志记录**: 增强 Worker 中的错误处理和日志记录，以便更好地进行故障排除。
   - **ID 生成**: [`worker.js`](worker.js:118) 中的 `generateId` 函数提供了基本的随机 ID。对于高流量应用，可以考虑使用更强大的唯一 ID 生成策略。

## 如何使用

1.  打开部署后的 Cloudflare Pages 网站。
2.  在 "创建新的焚毁消息" 部分：
    - 输入您的秘密消息。
    - （可选）设置一个访问密码。
    - 点击 "创建链接"。
3.  系统会生成一个唯一的分享链接。复制此链接并将其发送给接收者。
4.  当接收者打开链接时：
    - 如果设置了密码，他们需要输入密码。
    - 消息内容将被显示。
    - 消息随后会从服务器上永久删除，链接失效。