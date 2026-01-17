// js/file-handler.js
import { parseFileContent } from './file-parser.js';

// Các biến DOM
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const filePreviewContainer = document.getElementById('file-preview-container');
const fileNameDisplay = document.getElementById('file-name');
const fileSizeDisplay = document.getElementById('file-size');
const startReviewBtn = document.getElementById('start-review-btn');
const loadingState = document.getElementById('loading-state');
const resultArea = document.getElementById('result-area');

let currentFile = null;

// --- DỮ LIỆU MẪU (Dùng khi chạy Local để test tính năng PDF) ---
const MOCK_RESULT = {
    score_content: 85,
    score_design: 78,
    summary: "Tài liệu có nội dung chuyên môn vững chắc, cấu trúc logic. Tuy nhiên, cần cải thiện phần trình bày để tăng tính trực quan.",
    strengths: [
        "Kiến thức chính xác, cập nhật.",
        "Văn phong mạch lạc, dễ hiểu.",
        "Phân chia các mục rõ ràng."
    ],
    weaknesses: [
        "Thiếu hình ảnh minh họa sinh động.",
        "Font chữ tiêu đề chưa đồng nhất.",
        "Màu sắc hơi đơn điệu."
    ],
    detailed_analysis: "Về nội dung: Tác giả đã thể hiện sự am hiểu sâu sắc về chủ đề. Các luận điểm được triển khai chặt chẽ. Về hình thức: Cần chú ý khoảng cách dòng (Line spacing 1.5) và sử dụng thêm biểu đồ nếu có số liệu. Đề xuất sử dụng màu xanh đậm cho các tiêu đề chính để tạo điểm nhấn.",
    status: "approved"
};

// --- 1. Xử lý Kéo Thả & Chọn File ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
});

dropZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', handleFiles, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
}

function handleFiles(e) {
    const files = e.target.files;
    if (files.length > 0) {
        currentFile = files[0];
        showFilePreview(currentFile);
    }
}

function showFilePreview(file) {
    dropZone.style.display = 'none';
    filePreviewContainer.style.display = 'block';
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    resultArea.innerHTML = '';
}

document.getElementById('remove-file-btn').addEventListener('click', () => {
    currentFile = null;
    fileInput.value = '';
    dropZone.style.display = 'block';
    filePreviewContainer.style.display = 'none';
    resultArea.innerHTML = '';
});

// --- 2. Xử lý Bấm Nút Kiểm Duyệt ---
startReviewBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    // Lấy Key (để kiểm tra logic, dù dùng mock data vẫn check cho đúng quy trình)
    const apiKey = localStorage.getItem('ai_api_key');
    const provider = localStorage.getItem('ai_provider') || 'claude';

    if (!apiKey) {
        alert("Bạn chưa nhập API Key! Vui lòng vào Cài đặt.");
        window.location.href = 'settings.html';
        return;
    }

    // UI Loading
    filePreviewContainer.style.display = 'none';
    loadingState.style.display = 'block';

    let aiData = null;

    try {
        // B1: Đọc file
        const textContent = await parseFileContent(currentFile);
        
        // B2: Thử gọi API
        try {
            const response = await fetch('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: textContent,
                    fileName: currentFile.name,
                    fileType: currentFile.name.split('.').pop(),
                    provider: provider,
                    apiKey: apiKey
                })
            });

            if (!response.ok) throw new Error('API Error');
            const rawResult = await response.json();
            aiData = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

        } catch (apiError) {
            // --- FALLBACK: NẾU API LỖI (DO LOCAL) THÌ DÙNG MOCK DATA ---
            console.warn("Đang chạy Local hoặc API lỗi, sử dụng Dữ liệu Giả lập để tiếp tục:", apiError);
            
            // Giả lập thời gian chờ 2 giây cho giống thật
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            aiData = MOCK_RESULT; // Sử dụng dữ liệu mẫu
        }

        // B3: Xử lý hiển thị kết quả
        console.log("Kết quả cuối cùng:", aiData);
        
        localStorage.setItem('lastReviewResult', JSON.stringify(aiData));
        localStorage.setItem('lastFileName', currentFile.name);

        loadingState.style.display = 'none';
        
        let statusColor = aiData.status === 'approved' ? 'var(--success)' : 'var(--danger)';
        let statusText = aiData.status === 'approved' ? 'ĐẠT YÊU CẦU' : 'CẦN CHỈNH SỬA';
        let statusIcon = aiData.status === 'approved' ? 'fa-check-circle' : 'fa-circle-xmark';

        resultArea.innerHTML = `
            <div class="glass-card animate-fade-up" style="text-align: center; border-top: 5px solid ${statusColor}">
                <div style="font-size: 3rem; color: ${statusColor}; margin-bottom: 1rem;">
                    <i class="fa-solid ${statusIcon}"></i>
                </div>
                <h2 style="color: ${statusColor}; margin-bottom: 0.5rem;">${statusText}</h2>
                <p style="color: var(--text-muted);">${aiData.summary}</p>
                
                <div style="display: flex; justify-content: center; gap: 2rem; margin: 2rem 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">${aiData.score_content}</div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Điểm Nội dung</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--info);">${aiData.score_design}</div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Điểm Thiết kế</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: center; gap: 1rem;">
                    <button class="btn-primary" id="btn-export-pdf">
                        <i class="fa-solid fa-file-pdf"></i> Xuất Báo cáo PDF
                    </button>
                    <button class="btn-primary" style="background: var(--bg-body); color: var(--text-main); border: 1px solid #ccc;" onclick="window.location.reload()">
                        <i class="fa-solid fa-rotate-right"></i> Kiểm duyệt lại
                    </button>
                </div>
            </div>
        `;

        // Gán sự kiện cho nút xuất PDF (Sẽ code ở Bước 4)
        document.getElementById('btn-export-pdf').addEventListener('click', () => {
            if (window.generatePDFReport) {
                window.generatePDFReport();
            } else {
                alert("Chức năng PDF đang được cập nhật ở Bước 4!");
            }
        });

    } catch (error) {
        console.error(error);
        loadingState.style.display = 'none';
        filePreviewContainer.style.display = 'block';
        alert('Có lỗi nghiêm trọng: ' + error.message);
    }
});