# 阅后即焚消息网站

一个简单的阅后即焚消息网站，利用 Cloudflare Pages、Cloudflare Workers 和 Cloudflare KV 实现消息的存储和阅读后销毁。

## 特性

*   创建包含秘密消息的唯一链接。
*   链接被访问并消息显示后，消息将自动销毁（从存储中删除）。
*   纯前端界面，后端逻辑由 Cloudflare Worker 处理。

## 使用的技术

*   HTML
*   CSS
*   JavaScript
*   Cloudflare Pages (用于托管静态文件和运行 Worker)
*   Cloudflare Workers (用于处理 API 请求和后端逻辑)
*   Cloudflare KV (用于存储消息)

## 部署到 Cloudflare Pages

请按照以下步骤将网站部署到 Cloudflare Pages：

### 步骤 1: 准备文件

确保你拥有以下文件：

*   `index.html`
*   `style.css`
*   `script.js`
*   `_worker.js` (包含 Worker 和路由逻辑)

如果你还没有这些文件，请根据之前的对话内容创建它们。

### 步骤 2: 创建 Git 仓库

将上述文件添加到一个 Git 仓库中（例如 GitHub, GitLab, Bitbucket）。

```bash
git init
git add .
git commit -m "Initial commit for burn after reading website"
git branch -M main
git remote add origin [你的仓库URL]
git push -u origin main
```

### 步骤 3: 创建 Cloudflare KV Namespace

Cloudflare KV 用于存储秘密消息。

1.  登录到你的 Cloudflare 仪表板。
2.  选择你的账户。
3.  在左侧导航栏中找到并点击“Workers & Pages”。
4.  点击“KV”。
5.  点击“创建 Namespace”。
6.  给你的 Namespace 起一个名字（例如 `SECRET_MESSAGES`）。记下这个名字，稍后会用到。
7.  点击“添加”。

### 步骤 4: 创建 Cloudflare Pages 项目

1.  在 Cloudflare 仪表板中，导航到“Workers & Pages”。
2.  点击“Pages”。
3.  点击“创建 Pages 项目”。
4.  选择“连接到 Git 提供商”。
5.  授权 Cloudflare 访问你的 Git 仓库，并选择你刚刚创建的包含项目文件的仓库。
6.  配置构建设置：
    *   **项目名称:** 给你的 Pages 项目起一个名字。
    *   **生产分支:** 选择你的主分支 (通常是 `main` 或 `master`)。
    *   **构建命令:** 留空。
    *   **构建输出目录:** 留空或设置为 `/`。
7.  点击“保存并部署”。

Cloudflare Pages 将会自动从你的 Git 仓库拉取文件并进行初步部署。

### 步骤 5: 绑定 KV Namespace 到 Pages 项目

为了让 Pages 项目中的 `_worker.js` 能够访问 KV 存储，你需要进行绑定。

1.  在 Cloudflare 仪表板中，导航到你的 Pages 项目设置。
2.  点击“设置”。
3.  点击“Functions”。
4.  在“KV Namespace Bindings”下，点击“添加绑定”。
5.  在“变量名称”中输入 `KV_NAMESPACE` (这需要与 `_worker.js` 代码中使用的变量名一致)。
6.  在“KV Namespace”下拉菜单中选择你在步骤 3 中创建的 Namespace (例如 `SECRET_MESSAGES`)。
7.  点击“保存”。

**重要：** 确保你的 `_worker.js` 文件中的 `const KV_NAMESPACE = YOUR_KV_NAMESPACE_NAME;` 这一行，将 `YOUR_KV_NAMESPACE_NAME` 替换为你实际创建的 KV Namespace 的名称。

### 步骤 6: 验证部署

部署完成后，Cloudflare Pages 会提供一个访问你网站的 URL。访问该 URL，测试消息生成和阅读后销毁功能。

## 工作原理

1.  用户在前端输入消息，点击生成链接。
2.  前端 JavaScript (`script.js`) 将消息通过 `fetch` 请求发送到 `/api/messages`。
3.  Cloudflare Pages 中的 `_worker.js` 拦截 `/api/messages` 的 POST 请求。
4.  `_worker.js` 生成一个唯一的 ID，将消息存储到绑定的 Cloudflare KV Namespace 中，键为生成的 ID，值为消息内容。
5.  `_worker.js` 将生成的 ID 返回给前端。
6.  前端 JavaScript 使用返回的 ID 构建一个包含该 ID 的 URL (例如 `你的域名/message/unique-id`)，并显示给用户。
7.  当有人访问包含消息 ID 的 URL (例如 `你的域名/message/some-id`) 时，Cloudflare Pages 中的 `_worker.js` 拦截该请求。
8.  `_worker.js` 从 URL 中提取消息 ID，并尝试从 KV Namespace 中获取对应的值。
9.  如果找到消息，`_worker.js` 将消息内容返回给前端，并立即从 KV Namespace 中删除该消息。
10. 如果未找到消息（已被删除或 ID 无效），`_worker.js` 返回 404 错误。
11. 前端 JavaScript 接收到消息内容后显示给用户。如果收到错误，则显示相应的提示。

## 注意事项

*   **安全性:** 此实现将消息存储在 Cloudflare KV 中，并通过一个唯一的 ID 访问。消息在第一次成功读取后会被删除。然而，请注意，如果消息在被读取前被多次请求（例如，通过自动化脚本），它仍然可能被多次获取。此外，虽然消息不直接在 URL 片段中，但 ID 本身是公开的。对于传输高度敏感的信息，可能需要更强的加密和安全措施。
*   **KV 存储限制:** Cloudflare KV 有存储大小和请求限制，对于超大消息或极高流量的场景，可能需要考虑其他解决方案。
*   **错误处理:** 提供的代码示例是基础版本，在生产环境中可能需要更健壮的错误处理和日志记录。

希望这份 README 文件能帮助你成功部署和理解这个阅后即焚网站！