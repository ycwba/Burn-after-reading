document.addEventListener('DOMContentLoaded', () => {
    const createView = document.getElementById('create-view');
    const readView = document.getElementById('read-view');
    const messageInput = document.getElementById('message-input');
    const passwordInput = document.getElementById('password-input');
    const createButton = document.getElementById('create-button');
    const generatedLinkContainer = document.getElementById('generated-link-container');
    const generatedLinkInput = document.getElementById('generated-link');
    const copyLinkButton = document.getElementById('copy-link-button');

    const passwordPrompt = document.getElementById('password-prompt');
    const readPasswordInput = document.getElementById('read-password-input');
    const submitPasswordButton = document.getElementById('submit-password-button');
    const messageDisplay = document.getElementById('message-display');
    const messageContent = document.getElementById('message-content');
    const messageStatus = document.getElementById('message-status');

    // Cloudflare Worker 端点 URL (稍后替换为实际 URL)
    const WORKER_URL = 'you yrl'; // 占位符

    // 检查 URL hash 以确定是创建还是读取
    const hash = window.location.hash.substring(1);

    if (hash) {
        // 读取模式
        createView.style.display = 'none';
        readView.style.display = 'block';
        fetchMessage(hash);
    } else {
        // 创建模式
        createView.style.display = 'block';
        readView.style.display = 'none';
    }

    createButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        const password = passwordInput.value;

        if (!message) {
            alert('消息内容不能为空！');
            return;
        }

        createButton.disabled = true;
        createButton.textContent = '正在创建...';

        try {
            // 模拟与 Worker 的交互
            const response = await fetch(WORKER_URL + '/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, password })
            });
            if (!response.ok) {
                throw new Error('创建消息失败: ' + await response.text());
            }
            const data = await response.json();
            const messageId = data.id;

            // 模拟成功创建
            // const messageId = 'mock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
            const link = `${window.location.origin}${window.location.pathname}#${messageId}`;

            generatedLinkInput.value = link;
            generatedLinkContainer.style.display = 'block';
            messageInput.value = '';
            passwordInput.value = '';
            alert('链接已生成！');

        } catch (error) {
            console.error('创建错误:', error);
            alert('创建链接时出错: ' + error.message);
        } finally {
            createButton.disabled = false;
            createButton.textContent = '创建链接';
        }
    });

    copyLinkButton.addEventListener('click', () => {
        generatedLinkInput.select();
        document.execCommand('copy');
        alert('链接已复制到剪贴板！');
    });

    async function fetchMessage(id, password = '') {
        messageStatus.textContent = '正在获取消息...';
        passwordPrompt.style.display = 'none';
        messageDisplay.style.display = 'none';

        try {
            // 模拟与 Worker 的交互
            const fetchUrl = password ? `${WORKER_URL}/read/${id}?password=${encodeURIComponent(password)}` : `${WORKER_URL}/read/${id}`;
            const response = await fetch(fetchUrl);

            // 模拟 Worker 响应
            let mockResponse = response;
            // if (id.startsWith('mock-')) { // 简单模拟
            //     if (password === 'testpass' || !id.includes('protected')) { // 模拟密码或无密码
            //          mockResponse = {
            //             ok: true,
            //             status: 200,
            //             json: async () => ({ message: "这是一个模拟的秘密消息。它现在应该被销毁了。" }),
            //             text: async () => "这是一个模拟的秘密消息。它现在应该被销毁了。"
            //         };
            //     } else if (id.includes('protected') && password !== 'testpass' && password !== '') {
            //          mockResponse = {
            //             ok: false,
            //             status: 401, // 未授权
            //             text: async () => "密码错误"
            //         };
            //     } else if (id.includes('protected') && password === '') {
            //          mockResponse = {
            //             ok: false,
            //             status: 403, // 需要密码
            //             text: async () => "需要密码"
            //         };
            //     } else { // 模拟找不到
            //         mockResponse = {
            //             ok: false,
            //             status: 404,
            //             text: async () => "消息未找到或已被阅读。"
            //         };
            //     }
            // } else { // 模拟找不到
            //      mockResponse = {
            //         ok: false,
            //         status: 404,
            //         text: async () => "消息未找到或已被阅读。"
            //     };
            // }


            if (!mockResponse.ok) {
                const errorText = await mockResponse.text();
                if (mockResponse.status === 403) { // Forbidden - 需要密码
                    messageStatus.textContent = '此消息受密码保护。';
                    passwordPrompt.style.display = 'block';
                    readPasswordInput.value = '';
                    readPasswordInput.focus();
                    submitPasswordButton.onclick = () => { // 重新绑定事件，避免闭包问题
                        const enteredPassword = readPasswordInput.value;
                        if (enteredPassword) {
                            fetchMessage(id, enteredPassword);
                        } else {
                            alert('请输入密码');
                        }
                    };
                } else if (mockResponse.status === 401) { // Unauthorized - 密码错误
                    messageStatus.textContent = '密码错误。请重试。';
                    passwordPrompt.style.display = 'block';
                    readPasswordInput.value = '';
                    readPasswordInput.focus();
                     submitPasswordButton.onclick = () => {
                        const enteredPassword = readPasswordInput.value;
                        if (enteredPassword) {
                            fetchMessage(id, enteredPassword);
                        } else {
                            alert('请输入密码');
                        }
                    };
                }
                else {
                    throw new Error(errorText);
                }
                return;
            }

            const data = await mockResponse.json();
            messageContent.textContent = data.message;
            messageDisplay.style.display = 'block';
            messageStatus.textContent = '消息已成功获取。';
            // 实际应用中，Worker 会在发送消息后立即删除它。
            // 前端可以显示一条消息，说明它已被阅读且不再可用。
            // window.location.hash = ''; // 清除 hash，防止刷新重新获取 (可选)

        } catch (error) {
            console.error('读取错误:', error);
            messageStatus.textContent = '无法加载消息: ' + error.message;
            messageDisplay.style.display = 'none';
            passwordPrompt.style.display = 'none';
        }
    }

    // 初始密码提交按钮 (如果直接通过带密码保护的链接访问)
    submitPasswordButton.addEventListener('click', () => {
        const currentHash = window.location.hash.substring(1);
        const enteredPassword = readPasswordInput.value;
        if (currentHash && enteredPassword) {
            fetchMessage(currentHash, enteredPassword);
        } else if (!enteredPassword) {
            alert('请输入密码');
        }
    });
});