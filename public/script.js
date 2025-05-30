document.addEventListener('DOMContentLoaded', () => {
    const createMessageDiv = document.getElementById('create-message');
    const viewMessageDiv = document.getElementById('view-message');
    const messageContentInput = document.getElementById('message-content');
    const messagePasswordInput = document.getElementById('message-password');
    const createButton = document.getElementById('create-button');
    const shareLinkDiv = document.getElementById('share-link');
    const messageLinkInput = document.getElementById('message-link');
    const copyButton = document.getElementById('copy-button');

    const messageIdDisplay = document.getElementById('message-id-display');
    const passwordPromptDiv = document.getElementById('password-prompt');
    const viewPasswordInput = document.getElementById('view-password');
    const viewButton = document.getElementById('view-button');
    const messageDisplayDiv = document.getElementById('message-display');
    const viewedMessageContentTextarea = document.getElementById('viewed-message-content');
    const viewStatusParagraph = document.getElementById('view-status');

    // Check if we are viewing a message
    const pathSegments = window.location.pathname.split('/');
    const messageId = pathSegments[pathSegments.length - 1];

    if (messageId && pathSegments[pathSegments.length - 2] === 'message') {
        // Viewing a message
        createMessageDiv.classList.add('hidden');
        viewMessageDiv.classList.remove('hidden');
        messageIdDisplay.textContent = messageId;
        fetchMessage(messageId);
    } else {
        // Creating a message
        createMessageDiv.classList.remove('hidden');
        viewMessageDiv.classList.add('hidden');
    }

    // Event listener for create button
    createButton.addEventListener('click', async () => {
        const message = messageContentInput.value;
        const password = messagePasswordInput.value;

        if (!message) {
            alert('消息内容不能为空！');
            return;
        }

        try {
            const response = await fetch('/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, password }),
            });

            if (response.ok) {
                const { id } = await response.json();
                const shareUrl = `${window.location.origin}/message/${id}`;
                messageLinkInput.value = shareUrl;
                shareLinkDiv.classList.remove('hidden');
                createButton.disabled = true; // Prevent creating multiple messages
            } else {
                const errorText = await response.text();
                alert(`创建消息失败: ${errorText}`);
            }
        } catch (error) {
            console.error('Error creating message:', error);
            alert('创建消息时发生错误。');
        }
    });

    // Event listener for copy button
    copyButton.addEventListener('click', () => {
        messageLinkInput.select();
        navigator.clipboard.writeText(messageLinkInput.value).then(() => {
            alert('链接已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制链接失败。');
        });
    });

    // Event listener for view button (for password protected messages)
    viewButton.addEventListener('click', () => {
        fetchMessage(messageId, viewPasswordInput.value);
    });

    // Function to fetch message
    async function fetchMessage(id, password = null) {
        let url = `/message/${id}`;
        if (password) {
            // Append password as query parameter for GET request
            url += `?password=${encodeURIComponent(password)}`;
        }

        try {
            const response = await fetch(url);

            if (response.ok) {
                const { message } = await response.json();
                viewedMessageContentTextarea.value = message;
                messageDisplayDiv.classList.remove('hidden');
                passwordPromptDiv.classList.add('hidden'); // Hide password prompt if successful
                viewStatusParagraph.textContent = ''; // Clear status message
            } else if (response.status === 401) {
                // Password required or incorrect
                passwordPromptDiv.classList.remove('hidden');
                messageDisplayDiv.classList.add('hidden');
                viewStatusParagraph.textContent = '请输入密码或密码不正确。';
            } else {
                const errorText = await response.text();
                viewStatusParagraph.textContent = `获取消息失败: ${errorText}`;
                messageDisplayDiv.classList.add('hidden');
                passwordPromptDiv.classList.add('hidden'); // Hide password prompt on other errors
            }
        } catch (error) {
            console.error('Error fetching message:', error);
            viewStatusParagraph.textContent = '获取消息时发生错误。';
            messageDisplayDiv.classList.add('hidden');
            passwordPromptDiv.classList.add('hidden'); // Hide password prompt on other errors
        }
    }
});