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

// 3. Xử lý Lưu (CHỈ KIỂM TRA ĐỊNH DẠNG - KHÔNG GỌI SERVER)
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const provider = providerSelect.value;
        const key = keyInput.value.trim();

        if (!key) {
            showStatus('Vui lòng nhập API Key!', 'red');
            return;
        }

        // --- KIỂM TRA ĐỊNH DẠNG CƠ BẢN ---
        let isValidFormat = true;
        let warningMsg = "";

        if (provider === 'claude') {
            if (!key.startsWith('sk-ant-')) {
                isValidFormat = false;
                warningMsg = "Key Claude thường bắt đầu bằng 'sk-ant-'";
            }
        } 
        else if (provider === 'gemini') {
            if (!key.startsWith('AIza')) {
                isValidFormat = false;
                warningMsg = "Key Gemini thường bắt đầu bằng 'AIza'";
            }
        }
        else if (provider === 'openai') {
            if (!key.startsWith('sk-')) {
                isValidFormat = false;
                warningMsg = "Key OpenAI thường bắt đầu bằng 'sk-'";
            }
        }

        // Nếu định dạng sai nhưng người dùng vẫn muốn lưu -> Cho phép nhưng cảnh báo
        if (!isValidFormat) {
            if(!confirm(`Cảnh báo: ${warningMsg}. Bạn có chắc chắn đây là Key đúng không?`)) {
                return;
            }
        }

        // --- LƯU TRỰC TIẾP VÀO LOCALSTORAGE ---
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('ai_api_key', key);

        showStatus('<i class="fa-solid fa-check-circle"></i> Đã lưu cấu hình!', 'green');

        // Hiệu ứng visual
        keyInput.style.borderColor = 'var(--success)';
        setTimeout(() => {
            statusMsg.textContent = '';
            keyInput.style.borderColor = '#ccc';
        }, 2000);
    });
}

function showStatus(msg, color) {
    statusMsg.innerHTML = msg;
    statusMsg.style.color = color === 'green' ? 'var(--success)' : (color === 'red' ? 'var(--danger)' : 'var(--warning)');
}