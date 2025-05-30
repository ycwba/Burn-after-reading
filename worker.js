// Cloudflare Worker Script for Burn After Reading

// 注意: 您需要在 Cloudflare Dashboard 中创建一个 KV 命名空间
// 并将其绑定到此 Worker，绑定名称为 `BURN_MESSAGES_KV`

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p); // e.g., ['', 'create'] or ['', 'read', 'messageId']

    // 启用 CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // 生产环境中应替换为您的前端域名
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST' && pathParts[0] === 'create') {
        try {
            const { message, password } = await request.json();
            if (!message) {
                return new Response(JSON.stringify({ error: 'Message content is required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const id = generateId();
            const dataToStore = { message };

            if (password) {
                // 简单哈希密码 (生产环境应使用更安全的哈希算法，如 Argon2 或 bcrypt，但这在 Worker 中可能复杂)
                // 这里为了简单，我们直接存储或使用一个简单的哈希。
                // 更好的做法是客户端加密，服务器只存储密文和密码哈希。
                // 或者，如果 Worker 支持 SubtleCrypto，可以使用它。
                // const hashedPassword = await hashPassword(password); // 假设有此函数
                dataToStore.passwordHash = password; // 简化：直接存储密码或简单处理后的密码
                                                    // 警告：直接存储明文密码非常不安全！仅用于演示。
                                                    // 实际应用中，应在客户端进行加密，或服务器端进行强哈希。
            }

            // 将数据存入 KV，设置一个过期时间（例如 24 小时）以防消息永远不被读取
            // TTL (Time To Live) in seconds. 60 * 60 * 24 = 24 hours.
            await BURN_MESSAGES_KV.put(id, JSON.stringify(dataToStore), { expirationTtl: 86400 });

            return new Response(JSON.stringify({ id }), {
                status: 201, // Created
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } catch (error) {
            console.error('Create error:', error);
            return new Response(JSON.stringify({ error: 'Failed to create message: ' + error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    }

    if (request.method === 'GET' && pathParts[0] === 'read' && pathParts[1]) {
        const id = pathParts[1];
        const providedPassword = url.searchParams.get('password');

        try {
            const storedDataString = await BURN_MESSAGES_KV.get(id);

            if (!storedDataString) {
                return new Response(JSON.stringify({ error: 'Message not found or already read' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const storedData = JSON.parse(storedDataString);

            if (storedData.passwordHash) {
                if (!providedPassword) {
                    return new Response(JSON.stringify({ error: 'Password required' }), {
                        status: 403, // Forbidden
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }
                // 简单比较 (与上面存储逻辑对应)
                // const passwordsMatch = await verifyPassword(providedPassword, storedData.passwordHash); // 假设有此函数
                const passwordsMatch = (providedPassword === storedData.passwordHash); // 简化比较
                if (!passwordsMatch) {
                    return new Response(JSON.stringify({ error: 'Incorrect password' }), {
                        status: 401, // Unauthorized
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }
            }

            // 成功读取，从 KV 中删除消息
            await BURN_MESSAGES_KV.delete(id);

            return new Response(JSON.stringify({ message: storedData.message }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } catch (error) {
            console.error('Read error:', error);
            return new Response(JSON.stringify({ error: 'Failed to read message: ' + error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Not Found or Invalid Method' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

function generateId(length = 12) {
    // 生成一个随机的、相对唯一的 ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// 将来可以添加的密码哈希函数 (需要 Worker 环境支持 crypto 或导入库)
// async function hashPassword(password) {
//     // 使用 SubtleCrypto API (如果可用)
//     // const encoder = new TextEncoder();
//     // const data = encoder.encode(password);
//     // const hashBuffer = await crypto.subtle.digest('SHA-256', data);
//     // return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
//     return 'hashed_' + password; // 极简占位符
// }

// async function verifyPassword(providedPassword, storedHash) {
//     // const hashedProvided = await hashPassword(providedPassword);
//     // return hashedProvided === storedHash;
//     return ('hashed_' + providedPassword) === storedHash; // 极简占位符
// }