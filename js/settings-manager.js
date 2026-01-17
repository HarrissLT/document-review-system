// js/settings-manager.js

const form = document.getElementById('api-settings-form');
const providerSelect = document.getElementById('ai-provider');
const keyInput = document.getElementById('api-key-input');
const statusMsg = document.getElementById('api-status-msg');
const toggleBtn = document.getElementById('toggle-key-visibility');

// 1. Load settings khi mở trang
document.addEventListener('DOMContentLoaded', () => {
    const savedProvider = localStorage.getItem('ai_provider') || 'claude';
    const savedKey = localStorage.getItem('ai_api_key') || '';

    if (providerSelect) providerSelect.value = savedProvider;
    if (keyInput) keyInput.value = savedKey;
});

// 2. Toggle hiện/ẩn mật khẩu
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const type = keyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        keyInput.setAttribute('type', type);
        toggleBtn.innerHTML = type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    });
}

// 3. Xử lý Lưu và Kiểm tra Key
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const provider = providerSelect.value;
        const key = keyInput.value.trim();

        if (!key) {
            showStatus('Vui lòng nhập API Key!', 'red');
            return;
        }

        showStatus('<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra Key...', 'orange');

        try {
            // CÁCH 1: Thử gọi API Serverless (Sẽ chạy tốt trên Vercel)
            const response = await fetch('/api/test-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, key })
            });

            // Nếu Server trả về 404 hoặc 405 (do chạy Local), ta chuyển sang CÁCH 2
            if (response.status === 404 || response.status === 405) {
                throw new Error('Local Mode');
            }

            const data = await response.json();
            
            if (data.valid) {
                saveKey(provider, key);
            } else {
                showStatus(`<i class="fa-solid fa-circle-xmark"></i> Key không hợp lệ: ${data.error}`, 'red');
            }

        } catch (error) {
            // CÁCH 2: Fallback kiểm tra Client-side (Cho phép lưu khi chạy Local)
            console.warn("API Check failed, switching to local validation:", error);
            
            let isValidFormat = false;
            if (provider === 'claude' && key.startsWith('sk-')) isValidFormat = true;
            if (provider === 'openai' && key.startsWith('sk-')) isValidFormat = true;
            if (provider === 'gemini' && key.length > 20) isValidFormat = true;

            if (isValidFormat) {
                saveKey(provider, key);
                // Thêm cảnh báo nhỏ
                console.log("Đã lưu Key (Chế độ Local - Chưa kiểm tra thực tế)");
            } else {
                showStatus('Định dạng Key có vẻ không đúng. Vui lòng kiểm tra lại.', 'red');
            }
        }
    });
}

function saveKey(provider, key) {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_api_key', key);
    showStatus('<i class="fa-solid fa-check-circle"></i> Đã lưu cấu hình thành công!', 'green');
    
    // Ẩn thông báo sau 2s
    setTimeout(() => {
        statusMsg.textContent = '';
    }, 2000);
}

function showStatus(msg, color) {
    statusMsg.innerHTML = msg;
    statusMsg.style.color = color === 'green' ? 'var(--success)' : (color === 'red' ? 'var(--danger)' : 'var(--warning)');
}