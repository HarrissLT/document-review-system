// api/test-key.js
import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const { provider, key } = await req.json();
        if (!key) throw new Error('No Key');

        // Test Claude
        if (provider === 'claude') {
            const anthropic = new Anthropic({ apiKey: key });
            await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1,
                messages: [{ role: "user", content: "Hi" }]
            });
        }
        // Test Gemini
        else if (provider === 'gemini') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hi" }] }]
                })
            });
            if (!res.ok) throw new Error('Invalid Gemini Key');
        }
        // Test OpenAI
        else if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            if (!res.ok) throw new Error('Invalid OpenAI Key');
        }

        return new Response(JSON.stringify({ valid: true }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ valid: false, error: error.message }), { status: 200 });
    }
}