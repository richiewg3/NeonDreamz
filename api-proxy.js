const http = require('http');

async function handler(req, res) {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });
    req.on('end', async () => {
        try {
            const { userPrompt, tableData } = JSON.parse(body || '{}');
            if (!userPrompt || !Array.isArray(tableData)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Invalid request body' }));
            }

            const systemPrompt = 'You are an intelligent data editing assistant. Your task is to modify the provided JSON dataset based on the user\'s instruction. You must return ONLY the updated dataset in a valid JSON array-of-objects format. Do not add any commentary, explanations, markdown formatting, or any text outside of the JSON structure.';
            const fullUserPrompt = `User instruction: "${userPrompt}"\n\nInput Dataset:\n${JSON.stringify(tableData, null, 2)}`;

            const apiKey = process.env.MYY_SECRET_SHH;
            if (!apiKey) {
                throw new Error('Missing OpenRouter API key');
            }

            const payload = {
                model: 'anthropic/claude-3.5-sonnet',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: fullUserPrompt }
                ]
            };

            const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!apiResponse.ok) {
                const errorDetail = await apiResponse.text();
                throw new Error(errorDetail || apiResponse.statusText);
            }

            const data = await apiResponse.json();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
        }
    });
}

if (require.main === module) {
    const port = process.env.PORT || 3000;
    http.createServer(handler).listen(port, () => {
        console.log(`API proxy listening on port ${port}`);
    });
} else {
    module.exports = handler;
}
