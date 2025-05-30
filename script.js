document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const generateLinkBtn = document.getElementById('generateLinkBtn');
    const linkOutput = document.getElementById('linkOutput');
    const secretLinkInput = document.getElementById('secretLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const messageDisplay = document.getElementById('messageDisplay');
    const secretMessageContent = document.getElementById('secretMessageContent');
    const container = document.querySelector('.container');

    // Check if there is a message in the URL fragment
    const fragment = window.location.hash.substring(1);

    if (fragment) {
        // Display the message
        try {
            const decodedMessage = atob(fragment); // Decode base64
            secretMessageContent.textContent = decodedMessage;
            messageDisplay.classList.remove('hidden');
            container.classList.add('message-view'); // Optional: add a class for styling message view

            // Clear the fragment from the URL
            history.replaceState(null, '', window.location.pathname + window.location.search);

        } catch (e) {
            secretMessageContent.textContent = '无法读取消息。链接可能已失效或损坏。';
            messageDisplay.classList.remove('hidden');
             container.classList.add('message-view');
        }

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
                const encodedMessage = btoa(message); // Encode to base64
                const secretUrl = `${window.location.origin}${window.location.pathname}#${encodedMessage}`;
                secretLinkInput.value = secretUrl;
                linkOutput.classList.remove('hidden');
                messageInput.classList.add('hidden');
                generateLinkBtn.classList.add('hidden');
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