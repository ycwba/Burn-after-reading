document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const generateLinkBtn = document.getElementById('generateLinkBtn');
    const linkOutput = document.getElementById('linkOutput');
    const secretLinkInput = document.getElementById('secretLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const messageDisplay = document.getElementById('messageDisplay');
    const secretMessageContent = document.getElementById('secretMessageContent');
    const container = document.querySelector('.container');

const API_BASE_URL = '/api'; // Assume API is hosted at /api

    // Check if the URL path contains a message ID (e.g., /message/some-id)
    const pathSegments = window.location.pathname.split('/');
    const messageIdIndex = pathSegments.indexOf('message');
    const messageId = (messageIdIndex !== -1 && messageIdIndex < pathSegments.length - 1) ? pathSegments[messageIdIndex + 1] : null;

    if (messageId) {
        // Attempt to fetch and display the message
        fetch(`${API_BASE_URL}/messages/${messageId}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                         throw new Error('消息未找到或已销毁。');
                    }
                    throw new Error('获取消息失败。');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.message) {
                    secretMessageContent.textContent = data.message;
                    messageDisplay.classList.remove('hidden');
                    container.classList.add('message-view'); // Optional: add a class for styling message view
                } else {
                     throw new Error('无法读取消息。链接可能已失效或损坏。');
                }
            })
            .catch(error => {
                secretMessageContent.textContent = error.message;
                messageDisplay.classList.remove('hidden');
                container.classList.add('message-view');
            });

        // Hide the link generation part
        messageInput.classList.add('hidden');
        generateLinkBtn.classList.add('hidden');
        linkOutput.classList.add('hidden');

    } else {
        // Show the link generation part
        messageInput.classList.remove('hidden');
        generateLinkBtn.classList.remove('hidden');
        linkOutput.classList.add('hidden'); // Initially hidden
        messageDisplay.classList.add('hidden'); // Initially hidden
        container.classList.remove('message-view');

        // Add event listener for generating link
        generateLinkBtn.addEventListener('click', () => {
            const message = messageInput.value;
            if (message) {
                // Send message to backend API
                fetch(`${API_BASE_URL}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('生成链接失败。');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.id) {
                        const secretUrl = `${window.location.origin}/message/${data.id}`;
                        secretLinkInput.value = secretUrl;
                        linkOutput.classList.remove('hidden');
                        messageInput.classList.add('hidden');
                        generateLinkBtn.classList.add('hidden');
                    } else {
                         throw new Error('生成链接失败：无效的响应。');
                    }
                })
                .catch(error => {
                    alert(error.message);
                    // Optionally show the input again on error
                    messageInput.classList.remove('hidden');
                    generateLinkBtn.classList.remove('hidden');
                });

            } else {
                alert('请输入消息！');
            }
        });

        // Add event listener for copying link
        copyLinkBtn.addEventListener('click', () => {
            secretLinkInput.select();
            secretLinkInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            alert('链接已复制到剪贴板！');
        });
    }
});