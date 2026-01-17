// js/history-manager.js

// Hàm lưu lịch sử (được gọi từ pdf-generator.js sau khi xuất PDF xong)
window.saveToHistory = function(fileName, data) {
    const historyItem = {
        id: Date.now(),
        fileName: fileName,
        date: new Date().toLocaleDateString('vi-VN'),
        score: Math.round((data.score_content + data.score_design) / 2),
        status: data.status,
        summary: data.summary
    };

    let history = JSON.parse(localStorage.getItem('review_history') || '[]');
    history.unshift(historyItem); // Thêm vào đầu danh sách
    localStorage.setItem('review_history', JSON.stringify(history));
    
    console.log("Đã lưu lịch sử:", historyItem);
};

// Hàm hiển thị lịch sử (Dùng cho trang history.html)
window.loadHistoryTable = function() {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;

    const history = JSON.parse(localStorage.getItem('review_history') || '[]');
    
    if (history.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Chưa có dữ liệu lịch sử</td></tr>';
        return;
    }

    tableBody.innerHTML = history.map(item => `
        <tr class="fade-in-up">
            <td>
                <div style="font-weight: 500;">${item.fileName}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${item.date}</div>
            </td>
            <td>
                <span style="font-weight: 700; color: var(--primary);">${item.score}/100</span>
            </td>
            <td>
                <span class="badge ${item.status === 'approved' ? 'approved' : 'rejected'}">
                    ${item.status === 'approved' ? 'Đạt yêu cầu' : 'Cần sửa'}
                </span>
            </td>
            <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted);">
                ${item.summary}
            </td>
            <td>
                <button class="btn-icon" onclick="alert('Tính năng xem lại chi tiết đang phát triển')">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn-icon delete-btn" onclick="deleteHistoryItem(${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

window.deleteHistoryItem = function(id) {
    if(!confirm("Bạn có chắc muốn xóa bản ghi này?")) return;
    let history = JSON.parse(localStorage.getItem('review_history') || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem('review_history', JSON.stringify(history));
    window.loadHistoryTable();
};

// Tự động load khi vào trang history
document.addEventListener('DOMContentLoaded', () => {
    if(window.location.pathname.includes('history.html')) {
        window.loadHistoryTable();
    }
});