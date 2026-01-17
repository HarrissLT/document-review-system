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

// 3. Xử lý Lưu (Cho phép Lưu cưỡng ép nếu Check lỗi)
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const provider = providerSelect.value;
        const key = keyInput.value.trim();

        if (!key) {
            showStatus('Vui lòng nhập API Key!', 'red');
            return;
        }

        // Kiểm tra sơ bộ định dạng (Client side check)
        if (key.length < 10) {
             showStatus('Key quá ngắn, vui lòng kiểm tra lại.', 'red');
             return;
        }

        showStatus('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...', 'orange');

        try {
            // Thử gọi API kiểm tra (nhưng không bắt buộc phải thành công 100%)
            const response = await fetch('/api/test-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, key })
            });

            // Nếu chạy Local (404/405) hoặc Server lỗi (500) -> Vẫn cho lưu
            if (!response.ok) {
                console.warn("Server check failed, forcing save.");
                saveKey(provider, key, true); // True = Lưu có cảnh báo nhẹ
                return;
            }

            const data = await response.json();
            
            if (data.valid) {
                saveKey(provider, key, false); // False = Lưu thành công hoàn toàn
            } else {
                // Nếu Server trả về rõ ràng là Key sai -> Vẫn cho lưu nhưng cảnh báo
                console.warn("API báo key sai: " + data.error);
                if(confirm("Hệ thống báo Key này có thể không hoạt động. Bạn có chắc chắn muốn lưu không?")) {
                    saveKey(provider, key, true);
                } else {
                    showStatus(`<i class="fa-solid fa-circle-xmark"></i> ${data.error}`, 'red');
                }
            }

        } catch (error) {
            // Lỗi mạng hoặc lỗi khác -> Vẫn cho lưu
            console.error("Network error, forcing save:", error);
            saveKey(provider, key, true);
        }
    });
}

function saveKey(provider, key, isForced) {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_api_key', key);
    
    if (isForced) {
        showStatus('<i class="fa-solid fa-check-circle"></i> Đã lưu (Bỏ qua kiểm tra lỗi).', 'orange');
    } else {
        showStatus('<i class="fa-solid fa-check-circle"></i> Key hợp lệ! Đã lưu.', 'green');
    }
    
    // Ẩn thông báo sau 2s
    setTimeout(() => {
        statusMsg.textContent = '';
    }, 2000);
}

function showStatus(msg, color) {
    statusMsg.innerHTML = msg;
    statusMsg.style.color = color === 'green' ? 'var(--success)' : (color === 'red' ? 'var(--danger)' : 'var(--warning)');
}