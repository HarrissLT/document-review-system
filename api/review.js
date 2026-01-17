// api/review.js
import Anthropic from '@anthropic-ai/sdk';

export const config = {
    runtime: 'edge', // Chạy trên môi trường Edge siêu nhanh
};

export default async function handler(req) {
    // 1. Chỉ chấp nhận Method POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        // 2. Lấy dữ liệu từ Client gửi lên
        const { content, fileName, fileType, provider, apiKey } = await req.json();

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 401 });
        }

        // 3. Chuẩn bị Prompt (Câu lệnh cho AI)
        // Yêu cầu AI trả về JSON thuần túy để code dễ đọc
        const systemPrompt = `
            Bạn là Chuyên gia Kiểm định Chất lượng Tài liệu Giáo dục (QA Specialist).
            Nhiệm vụ: Đánh giá tài liệu, chấm điểm và nhận xét chi tiết.
            
            OUTPUT FORMAT (JSON ONLY):
            {
                "score_content": (0-100),
                "score_design": (0-100),
                "summary": "Tóm tắt ngắn gọn",
                "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
                "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
                "detailed_analysis": "Phân tích chi tiết...",
                "status": "approved" (nếu điểm TB > 70) hoặc "rejected"
            }
        `;

        const userMessage = `
            Phân tích file: ${fileName} (${fileType})
            Nội dung tài liệu:
            ---
            ${content.substring(0, 25000)}
            ---
        `;

        let resultText = "";

        // 4. XỬ LÝ THEO TỪNG NHÀ CUNG CẤP (PROVIDER)

        // --- CASE 1: ANTHROPIC CLAUDE ---
        if (provider === 'claude') {
            const anthropic = new Anthropic({ apiKey: apiKey });
            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 2000,
                temperature: 0.3,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userMessage }
                ]
            });
            resultText = msg.content[0].text;
        }

        // --- CASE 2: GOOGLE GEMINI ---
        else if (provider === 'gemini') {
            // Dùng model gemini-1.5-flash hoặc gemini-pro cho ổn định
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: systemPrompt + "\n\n" + userMessage }]
                    }],
                    generationConfig: {
                        response_mime_type: "application/json" // Yêu cầu Gemini trả về JSON
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'Gemini API Error');
            }

            const data = await response.json();
            resultText = data.candidates[0].content.parts[0].text;
        }

        // --- CASE 3: OPENAI (CHATGPT) ---
        else if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o", // Dùng model mạnh nhất hiện tại
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    response_format: { type: "json_object" }, // Bắt buộc trả về JSON
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || 'OpenAI API Error');
            }

            const data = await response.json();
            resultText = data.choices[0].message.content;
        }

        // 5. Trả kết quả về Frontend
        return new Response(JSON.stringify(resultText), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}