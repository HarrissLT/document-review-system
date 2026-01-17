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

// 3. Xử lý Lưu (LƯU THẲNG - KHÔNG GỌI API KIỂM TRA)
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Chặn reload trang
        
        const provider = providerSelect.value;
        const key = keyInput.value.trim();

        if (!key) {
            showStatus('Vui lòng nhập API Key!', 'red');
            return;
        }

        // --- LƯU NGAY LẬP TỨC ---
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('ai_api_key', key);

        console.log("Đã lưu Key vào LocalStorage:", provider);

        // Thông báo thành công giả lập
        showStatus('<i class="fa-solid fa-check-circle"></i> Đã lưu cấu hình thành công!', 'green');

        // Hiệu ứng visual
        keyInput.style.borderColor = 'var(--success)';
        setTimeout(() => {
            statusMsg.textContent = '';
            keyInput.style.borderColor = '#ccc'; // Trả lại màu viền cũ
        }, 2000);
    });
}

function showStatus(msg, color) {
    statusMsg.innerHTML = msg;
    statusMsg.style.color = color === 'green' ? 'var(--success)' : (color === 'red' ? 'var(--danger)' : 'var(--warning)');
}