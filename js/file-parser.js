// js/file-parser.js

// Hàm chính để điều phối việc đọc file
export async function parseFileContent(file) {
    const fileType = file.name.split('.').pop().toLowerCase();

    try {
        if (fileType === 'txt') {
            return await readTextFile(file);
        } 
        else if (fileType === 'docx') {
            return await readDocxFile(file);
        }
        else if (['xls', 'xlsx'].includes(fileType)) {
            // Cần thư viện SheetJS (xlsx)
            return "Chức năng đọc Excel đang được cập nhật (Demo: Nội dung mô phỏng Excel).";
        }
        else if (fileType === 'pdf') {
            // Cần thư viện PDF.js
            return "Chức năng đọc PDF đang được cập nhật (Demo: Nội dung mô phỏng PDF).";
        }
        else {
            throw new Error("Định dạng file chưa được hỗ trợ đầy đủ trong phiên bản này.");
        }
    } catch (error) {
        console.error("Lỗi đọc file:", error);
        throw error;
    }
}

// 1. Đọc file Text (.txt)
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// 2. Đọc file Word (.docx) - Sử dụng thư viện Mammoth (đã nhúng ở index.html)
function readDocxFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            // Gọi thư viện mammoth toàn cục
            window.mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(function(result) {
                    resolve(result.value);
                })
                .catch(function(err) {
                    reject(err);
                });
        };
        reader.readAsArrayBuffer(file);
    });
}