// simple-router-test.js
addEventListener('fetch', event => {
    event.respondWith(handleSimpleRequest(event.request));
});

function handleSimpleRequest(request) {
    const url = new URL(request.url); // Standard URL parsing
    const pathParts = url.pathname.split('/').filter(p => p);
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json' // Ensure JSON response type
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    console.log(`[SimpleRouterTest] Request: ${request.method} ${url.pathname}`);

    if (request.method === 'POST' && pathParts[0] === 'create') {
        console.log('[SimpleRouterTest] Matched POST /create');
        return new Response(JSON.stringify({ message: 'Simple create endpoint reached successfully!' }), {
            status: 200, // Using 200 for simplicity in test
            headers: corsHeaders
        });
    }

    if (request.method === 'GET' && pathParts[0] === 'read' && pathParts[1]) {
        console.log(`[SimpleRouterTest] Matched GET /read/${pathParts[1]}`);
        return new Response(JSON.stringify({ message: `Simple read endpoint reached for id: ${pathParts[1]}` }), {
            status: 200,
            headers: corsHeaders
        });
    }

    console.log('[SimpleRouterTest] No route matched, returning 404.');
    return new Response(JSON.stringify({ error: 'Simple Router: Not Found' }), {
        status: 404,
        headers: corsHeaders
    });
}