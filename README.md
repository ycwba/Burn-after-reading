# 阅后即焚网站部署指南

## 介绍
此项目是一个阅后即焚网站，使用Cloudflare Pages部署。功能包括分享链接只能打开一次和可选访问密码。

## 部署到Cloudflare Pages

1. **安装Wrangler CLI**:
   - 确保您有Node.js安装。如果没有，请从[Node.js官网](https://nodejs.org/)下载并安装。
   - 打开终端，运行命令 `npm install -g wrangler` 来安装Wrangler CLI。如果遇到权限问题，使用 `sudo npm install -g wrangler` (在Linux/Mac) 或以管理员身份运行命令。

2. **创建Cloudflare账户**:
   - 访问[Cloudflare官网](https://dash.cloudflare.com/)，注册一个免费账户。如果您已有账户，请登录。

3. **创建KV命名空间**:
   - 登录Cloudflare仪表盘后，点击左侧菜单的 “Workers & Pages”。
   - 在 “KV” 部分，点击 “Create a namespace”。
   - 输入命名空间名称为 “MESSAGES”，然后点击 “Add”。
   - 创建后，您会看到命名空间 ID 和绑定名称。记下这些信息，因为在代码中需要引用 “MESSAGES” 作为绑定名称。
   - 如果您有多个环境 (如生产和开发)，可以为每个环境创建单独的命名空间。

4. **配置您的Cloudflare Pages项目**:
   - 在Cloudflare仪表盘中，导航到 “Pages”。
   - 点击 “Create a project”。
   - 选择代码来源：如果您的代码在GitHub等仓库中，选择连接Git仓库；否则，选择 “Connect to Git” 或手动上传代码。
     - 如果手动上传，将read_and_burn目录压缩为ZIP文件，然后上传。
   - 设置项目名称为 “read-and-burn” 或您喜欢的名称。
   - 配置构建设置：
     - 生产分支：设置为 “main” 或您的默认分支。
     - 构建命令：留空 (因为此项目不需要构建命令)。
     - 输出目录：留空。
   - 确保 “Functions” 选项启用，因为项目使用Pages Functions处理动态逻辑。

5. **绑定KV命名空间到项目**:
   - 在项目设置中，找到 “Environment variables” 或 “Secrets” 部分。
   - 添加一个新变量：
     - 键 (Key): `MESSAGES`
     - 值 (Value): 您在步骤3中创建的KV命名空间 ID (例如，a1b2c3d4e5f6... )。
   - 保存更改。

6. **部署项目**:
   - 使用Wrangler CLI从本地部署：
     - 打开终端，导航到read_and_burn目录：`cd read_and_burn`
     - 运行命令 `npx wrangler deploy --project-name=read-and-burn`
     - 如果是首次部署，可能需要登录Cloudflare：运行 `npx wrangler login` 并跟随提示。
   - 或者通过Cloudflare仪表盘部署：保存更改后，Cloudflare会自动构建和部署。

7. **测试网站**:
   - 访问部署后的URL (例如，https://read-and-burn.pages.dev)。
   - 创建一个消息，测试链接是否只能打开一次，并验证密码保护功能。
   - 如果遇到错误，检查控制台日志或Cloudflare仪表盘中的错误信息。

## 代码结构
- `index.html`: 静态页面，包含创建消息的表单。
- `_functions/create.js`: 处理创建消息的API，包括错误处理。
- `_functions/message-[id].js`: 处理访问消息的API，包括错误处理。

确保在部署前正确配置KV命名空间。如果有问题，请参考Cloudflare文档或提供错误细节。