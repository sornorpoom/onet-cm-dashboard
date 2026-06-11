/* dashboard.js - O-NET Interactive Dashboard Controller */

// Global State
let rawDataset = [];
let filteredDataset = [];
let currentGrade = "p6";
let currentSubject = "วิทยาศาสตร์";
let currentYear = "all";
let scoreColumns = []; // Array of standard indicator column names (Mean)
let stdColumns = [];   // Array of standard indicator base names (e.g. "ว 1.1")
let charts = {};       // Chart.js instances

// Pagination State for School Explorer
let currentPage = 1;
const itemsPerPage = 12;

// Standards Descriptions mapping
const STANDARDS_DESC = {
    "วิทยาศาสตร์": {
        "ว 1.1": "ความหลากหลายของสิ่งมีชีวิตและสิ่งแวดล้อม",
        "ว 1.2": "โครงสร้าง หน้าที่ และระบบต่างๆ ของสิ่งมีชีวิต",
        "ว 1.3": "กระบวนการถ่ายทอดลักษณะทางพันธุกรรมและการเปลี่ยนแปลง",
        "ว 2.1": "สมบัติของสาร องค์ประกอบและการเปลี่ยนแปลงสาร",
        "ว 2.2": "แรง การเคลื่อนที่ และผลของแรงที่กระทำต่อวัตถุ",
        "ว 2.3": "พลังงานในชีวิตประจำวันและการเปลี่ยนแปลงพลังงาน",
        "ว 3.1": "องค์ประกอบ โครงสร้าง และกระบวนการเปลี่ยนแปลงของโลก",
        "ว 3.2": "ลม ฟ้า อากาศ ดาราศาสตร์ และเทคโนโลยีอวกาศ",
        "ว 4.2": "การแก้ปัญหาโดยใช้แนวคิดเชิงคำนวณและการออกแบบเทคโนโลยี"
    },
    "คณิตศาสตร์": {
        "ค 1.1": "จำนวนและการดำเนินการ (เศษส่วน ทศนิยม จำนวนนับ)",
        "ค 1.2": "แบบรูปและความสัมพันธ์ทางคณิตศาสตร์",
        "ค 2.1": "การวัดและเรขาคณิต (พื้นที่ ปริมาตร ทิศ เส้นขนาน)",
        "ค 2.2": "เรขาคณิตและการวิเคราะห์รูปเรขาคณิต",
        "ค 3.1": "สถิติและความน่าจะเป็น (แผนภูมิรูปภาพ/แท่ง)"
    },
    "ภาษาไทย": {
        "ท 1.1": "การอ่านออกเสียง จับใจความ และวิเคราะห์ความ",
        "ท 2.1": "การเขียนเรียงความ จดหมาย เชิงสร้างสรรค์และคัดลายมือ",
        "ท 3.1": "การฟัง การดู และการพูดนำเสนอ วิเคราะห์ วิจารณ์",
        "ท 4.1": "หลักการใช้ภาษา ชนิดของคำ ประโยค วลี คำยืม คำราชาศัพท์",
        "ท 5.1": "วรรณคดีและวรรณกรรม การวิเคราะห์คุณค่าและท่องจำอาขยาน"
    },
    "อังกฤษ": {
        "ต 1.1": "ความเข้าใจในการฟังและอ่านข้อความ บทสนทนา",
        "ต 1.2": "ทักษะการสื่อสารภาษา (การตอบโต้ แลกเปลี่ยนข้อมูล)",
        "ต 1.3": "การนำเสนอข้อมูลข่าวสาร ความคิดรวบยอด",
        "ต 2.1": "ความเข้าใจในวัฒนธรรมของเจ้าของภาษา (ประเพณี เทศกาล)",
        "ต 2.2": "ความเข้าใจความเหมือนและแตกต่างระหว่างภาษาและวัฒนธรรม",
        "ต 3.1": "การใช้ภาษาต่างประเทศในการเชื่อมโยงความรู้กับวิชาอื่น",
        "ต 4.1": "การใช้ภาษาต่างประเทศในสถานการณ์ต่างๆ ในสถานศึกษา",
        "ต 4.2": "การใช้ภาษาต่างประเทศเป็นเครื่องมือสืบค้นและศึกษาต่อ"
    }
};

// Register ChartDataLabels globally and disable by default for all charts
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    Chart.defaults.set('plugins.datalabels', {
        display: false
    });
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initEventListeners();
    tryAutoLoad();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

// Toggle Theme (Dark/Light)
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
    
    // Update charts font and grid colors for new theme
    updateChartsTheme();
}

function updateThemeIcon(theme) {
    const icon = document.getElementById("themeIcon");
    if (theme === "light") {
        icon.className = "fa-solid fa-moon";
    } else {
        icon.className = "fa-solid fa-sun";
    }
}

// Event Listeners Setup
function initEventListeners() {
    // Theme Toggle Button
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    
    // Reset Button
    document.getElementById("btnResetAll").addEventListener("click", () => {
        window.location.reload();
    });
    
    // Drag and Drop Zone
    const dropZone = document.getElementById("dropZone");
    
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });
    
    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });
    
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
    
    // File Input Select
    document.getElementById("fileInput").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });
    
    // Filters Event Listeners
    document.getElementById("gradeSelect").addEventListener("change", (e) => {
        currentGrade = e.target.value;
        loadSubjectData(currentSubject);
    });

    document.getElementById("subjectSelect").addEventListener("change", (e) => {
        currentSubject = e.target.value;
        loadSubjectData(currentSubject);
    });
    
    document.getElementById("filterYear").addEventListener("change", handleFilterChange);
    document.getElementById("filterDistrict").addEventListener("change", handleFilterChange);
    document.getElementById("filterSize").addEventListener("change", handleFilterChange);
    document.getElementById("filterLocation").addEventListener("change", handleFilterChange);
    document.getElementById("filterAffiliation").addEventListener("change", handleFilterChange);
    
    // Tab switching
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            
            e.target.classList.add("active");
            const tabId = e.target.getAttribute("data-tab");
            document.getElementById(`tab-${tabId}`).classList.add("active");
            
            // Re-render visible charts to adjust width/height properly
            setTimeout(resizeVisibleCharts, 100);
        });
    });
    
    // Search School
    document.getElementById("schoolSearchInput").addEventListener("input", () => {
        currentPage = 1;
        renderSchoolExplorer();
    });
    
    // Pagination Buttons
    document.getElementById("btnPrevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderSchoolExplorer();
        }
    });
    
    document.getElementById("btnNextPage").addEventListener("click", () => {
        const maxPage = Math.ceil(getFilteredSearchDataset().length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderSchoolExplorer();
        }
    });
    
    // Modal Close
    document.getElementById("modalCloseBtn").addEventListener("click", () => {
        document.getElementById("schoolDetailModal").classList.remove("active");
    });
    
    document.getElementById("schoolDetailModal").addEventListener("click", (e) => {
        if (e.target.id === "schoolDetailModal") {
            document.getElementById("schoolDetailModal").classList.remove("active");
        }
    });
    
    // Download PDF Button
    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
        const schoolName = document.getElementById("modalSchoolName").textContent;
        window.downloadSchoolPDF(schoolName);
    });
}

// Show error or success status inside the upload card
function showUploadStatus(message) {
    const statusDiv = document.getElementById("uploadStatus");
    statusDiv.textContent = message;
    statusDiv.style.display = "block";
}

const SUBJECT_FILES = {
    "p6": {
        "วิทยาศาสตร์": "onet ป.6 รายมาตรฐาน วิทยาศาสตร์ 65-68 - วิทยาศาสตร์.csv",
        "คณิตศาสตร์": "onet ป.6 รายมาตรฐาน คณิตศาสตร์ 65-68 - คณิตศาสตร์ ป.6.csv",
        "ภาษาไทย": "onet ป.6 รายมาตรฐาน ภาษาไทย 65 68 - ภาษาไทย ป.6.csv",
        "อังกฤษ": "onet ป.6 รายมาตรฐาน อังกฤษ 65 68 - อังกฤษ ป.6.csv"
    },
    "m3": {
        "วิทยาศาสตร์": "onet วิทยาศาสตร์ ม.3 มาตรฐาน 65 68 - วิทยาศาสตร์ ม.3.csv",
        "คณิตศาสตร์": "onet คณิตศาสตร์ ม.3 มาตรฐาน 65 68 - คณิตศาสตร์ ม.3.csv",
        "ภาษาไทย": "onet ภาษาไทย ม.3 มาตรฐาน 65 68 - ภาษาไทย ม.3.csv",
        "อังกฤษ": "onet อังกฤษ ม.3 มาตรฐาน 65 68 - อังกฤษ ม.3.csv"
    }
};

// Auto Load Attempt (in case running local web server or hosted on GitHub Pages)
function tryAutoLoad() {
    loadSubjectData(currentSubject || "วิทยาศาสตร์");
}

function loadSubjectData(subjectName) {
    const filename = SUBJECT_FILES[currentGrade][subjectName];
    if (!filename) return;
    
    // Show loading status inside the upload card
    showUploadStatus(`กำลังโหลดข้อมูลวิชา ${subjectName} จากระบบ...`);
    document.getElementById("uploadOverlay").style.display = "flex";
    
    fetch(filename)
        .then(response => {
            if (!response.ok) throw new Error("CORS or File Not Found");
            return response.blob();
        })
        .then(blob => {
            const file = new File([blob], filename, { type: "text/csv" });
            handleFile(file);
        })
        .catch(err => {
            console.log(`Auto-load failed for ${subjectName}. Showing file upload card. Details:`, err.message);
            showUploadStatus(`กรุณานำเข้าไฟล์ CSV สำหรับวิชา ${subjectName} เพื่อประมวลผลต่อ`);
            document.getElementById("uploadOverlay").style.display = "flex";
        });
}

// Process Uploaded File
function handleFile(file) {
    showUploadStatus("กำลังประมวลผลข้อมูล...");
    
    // Auto-detect subject and grade based on filename
    const filename = file.name.toLowerCase();
    
    // Subject detection
    if (filename.includes("คณิต")) {
        currentSubject = "คณิตศาสตร์";
    } else if (filename.includes("ไทย")) {
        currentSubject = "ภาษาไทย";
    } else if (filename.includes("อังกฤษ") || filename.includes("eng")) {
        currentSubject = "อังกฤษ";
    } else if (filename.includes("วิทย์") || filename.includes("วิทยาศาสตร์")) {
        currentSubject = "วิทยาศาสตร์";
    }
    document.getElementById("subjectSelect").value = currentSubject;
    
    // Grade detection
    if (filename.includes("ม.3") || filename.includes("ม3") || filename.includes("m.3") || filename.includes("m3") || filename.includes("grade9") || filename.includes("grade 9")) {
        currentGrade = "m3";
    } else if (filename.includes("ป.6") || filename.includes("ป6") || filename.includes("p.6") || filename.includes("p6") || filename.includes("grade6") || filename.includes("grade 6")) {
        currentGrade = "p6";
    }
    document.getElementById("gradeSelect").value = currentGrade;
    
    // Parse CSV
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length > 0 && results.data.length === 0) {
                showUploadStatus("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV กรุณาตรวจสอบไฟล์ของคุณ");
                return;
            }
            processParsedData(results.data);
        },
        error: function(err) {
            showUploadStatus("เกิดข้อผิดพลาด: " + err.message);
        }
    });
}

// Clean and parse column averages, mapping standard metadata
function processParsedData(data) {
    rawDataset = data.filter(row => row["ชื่อโรงเรียน"] && row["ชื่อโรงเรียน"].toString().trim() !== "");
    
    if (rawDataset.length === 0) {
        showUploadStatus("ไม่พบข้อมูลโรงเรียนในไฟล์ CSV นี้");
        return;
    }
    
    // Detect standard score columns
    const sampleRow = rawDataset[0];
    scoreColumns = Object.keys(sampleRow).filter(key => {
        return /^[คทวต]\s*\d+\.\d+\s*\(Mean\)$/.test(key);
    });
    
    if (scoreColumns.length === 0) {
        showUploadStatus("ไม่พบหลักฐานคะแนนรายมาตรฐานในไฟล์ CSV นี้ (ต้องมีคอลัมน์ชื่อเช่น 'ว 1.1 (Mean)')");
        return;
    }
    
    // Extract standard base names (e.g. "ว 1.1")
    stdColumns = scoreColumns.map(col => col.split("(")[0].trim());
    
    // Calculate school overall average for each row
    rawDataset.forEach((row, idx) => {
        row.__id = idx;
        let sum = 0;
        let count = 0;
        scoreColumns.forEach(col => {
            const val = parseFloat(row[col]);
            if (!isNaN(val)) {
                sum += val;
                count++;
            }
        });
        row.__overallAvg = count > 0 ? (sum / count) : 0;
        
        // Handle year column alias
        row.__year = row["ปีการศึกษา"] || row["ปี"] || "N/A";
    });
    
    // Hide upload overlay
    document.getElementById("uploadOverlay").style.display = "none";
    document.getElementById("uploadStatus").style.display = "none";
    
    // Populate Filter Dropdowns
    populateFilters();
    
    // Update Header Labels
    updateLabels();
    
    // Apply Filter and Render Dashboard
    currentPage = 1;
    applyFilters();
}

// Populate Filter Options dynamically
function populateFilters() {
    // Years
    const years = [...new Set(rawDataset.map(row => row.__year))].sort((a,b) => b-a);
    const filterYear = document.getElementById("filterYear");
    filterYear.innerHTML = '<option value="all">ทั้งหมด (ทุกปี)</option>';
    years.forEach(y => {
        filterYear.innerHTML += `<option value="${y}">${y}</option>`;
    });
    
    // Districts
    const districts = [...new Set(rawDataset.map(row => row["อำเภอที่ตั้งรร."]))].filter(Boolean).sort();
    const filterDistrict = document.getElementById("filterDistrict");
    filterDistrict.innerHTML = '<option value="all">ทั้งหมด (ทุกอำเภอ)</option>';
    districts.forEach(d => {
        filterDistrict.innerHTML += `<option value="${d}">${d}</option>`;
    });
    
    // Affiliations
    const affiliations = [...new Set(rawDataset.map(row => row["สังกัด"]))].filter(Boolean).sort();
    const filterAffiliation = document.getElementById("filterAffiliation");
    filterAffiliation.innerHTML = '<option value="all">ทั้งหมด (ทุกสังกัด)</option>';
    affiliations.forEach(a => {
        filterAffiliation.innerHTML += `<option value="${a}">${a}</option>`;
    });
}

// Update Title Labels
function updateLabels() {
    const gradeLabel = currentGrade === "p6" ? "ป.6" : "ม.3";
    document.getElementById("subjectTitle").textContent = `ผลวิเคราะห์วิชา ${currentSubject} ${gradeLabel}`;
    document.getElementById("subTitle").textContent = `สรุปผลคะแนน O-NET รายมาตรฐาน ปีการศึกษา 2565 - 2568`;
    
    // Render Standards Description List
    const descContainer = document.getElementById("standardsDescription");
    descContainer.innerHTML = "";
    
    const subjectMap = STANDARDS_DESC[currentSubject] || {};
    stdColumns.forEach(std => {
        const desc = subjectMap[std] || "รายละเอียดข้อมูลวิชา";
        descContainer.innerHTML += `
            <div>
                <strong style="color: var(--primary); font-family: var(--font-mono);">${std}:</strong>
                <span style="color: var(--text-secondary);">${desc}</span>
            </div>
        `;
    });
}

// Handle filter change event
function handleFilterChange() {
    currentPage = 1;
    applyFilters();
}

// Main Filter Logic
function applyFilters() {
    const yearVal = document.getElementById("filterYear").value;
    const districtVal = document.getElementById("filterDistrict").value;
    const sizeVal = document.getElementById("filterSize").value;
    const locationVal = document.getElementById("filterLocation").value;
    const affiliationVal = document.getElementById("filterAffiliation").value;
    
    filteredDataset = rawDataset.filter(row => {
        // Year filter
        if (yearVal !== "all" && row.__year.toString() !== yearVal.toString()) return false;
        
        // District filter
        if (districtVal !== "all" && row["อำเภอที่ตั้งรร."] !== districtVal) return false;
        
        // Size filter
        if (sizeVal !== "all" && row["ขนาดโรงเรียน"] !== sizeVal) return false;
        
        // Location filter
        if (locationVal !== "all" && row["ที่ตั้งโรงเรียน"] !== locationVal) return false;
        
        // Affiliation filter
        if (affiliationVal !== "all" && row["สังกัด"] !== affiliationVal) return false;
        
        return true;
    });
    
    // Suffix selected academic year in titles
    const yearText = yearVal === "all" ? "2565 - 2568" : yearVal;
    document.getElementById("overviewDistrictTitle").textContent = `คะแนนเฉลี่ยจำแนกตามอำเภอ ปีการศึกษา ${yearText}`;
    document.getElementById("overviewAffiliationTitle").textContent = `สัดส่วนผู้เข้าสอบตามสังกัด ปีการศึกษา ${yearText}`;
    document.getElementById("standardsMeanTitle").textContent = `คะแนนเฉลี่ยรายมาตรฐานการเรียนรู้ ปีการศึกษา ${yearText}`;
    document.getElementById("subTitle").textContent = `สรุปผลคะแนน O-NET รายมาตรฐาน ปีการศึกษา ${yearText}`;
    
    calculateSummaryKPIs();
    renderCharts();
    renderSchoolExplorer();
}

// Compute KPI Summary stats
function calculateSummaryKPIs() {
    const count = filteredDataset.length;
    if (count === 0) {
        document.getElementById("kpiAvgScore").textContent = "0.00";
        document.getElementById("kpiTotalStudents").textContent = "0";
        document.getElementById("kpiTotalSchools").textContent = "0";
        document.getElementById("kpiTopDistrict").textContent = "-";
        return;
    }
    
    // Calculate total students and weighted overall average score
    let totalStudents = 0;
    let sumWeightedScores = 0;
    
    filteredDataset.forEach(row => {
        const students = parseInt(row["จำนวนผู้เข้าสอบ"]) || 0;
        const avg = row.__overallAvg || 0;
        totalStudents += students;
        sumWeightedScores += (avg * students);
    });
    
    const overallAvgScore = totalStudents > 0 ? (sumWeightedScores / totalStudents) : 0;
    
    // Find top district
    const districtScores = {};
    const districtStudents = {};
    
    filteredDataset.forEach(row => {
        const d = row["อำเภอที่ตั้งรร."];
        const students = parseInt(row["จำนวนผู้เข้าสอบ"]) || 0;
        const avg = row.__overallAvg || 0;
        
        if (d) {
            if (!districtScores[d]) {
                districtScores[d] = 0;
                districtStudents[d] = 0;
            }
            districtScores[d] += (avg * students);
            districtStudents[d] += students;
        }
    });
    
    let topDistrict = "-";
    let topDistrictAvg = -1;
    
    Object.keys(districtScores).forEach(d => {
        const students = districtStudents[d];
        const avg = students > 0 ? (districtScores[d] / students) : 0;
        if (avg > topDistrictAvg) {
            topDistrictAvg = avg;
            topDistrict = d;
        }
    });
    
    // Update DOM
    document.getElementById("kpiAvgScore").textContent = overallAvgScore.toFixed(2);
    document.getElementById("kpiTotalStudents").textContent = totalStudents.toLocaleString();
    document.getElementById("kpiTotalSchools").textContent = count.toLocaleString();
    document.getElementById("kpiTopDistrict").textContent = topDistrict + ` (${topDistrictAvg.toFixed(1)})`;
}

// Get Theme Colors for Chart.js
function getChartThemeColors() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    return {
        text: isDark ? "#94a3b8" : "#475569",
        grid: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
        primary: "#8b5cf6",
        secondary: "#14b8a6",
        indigo: "#6366f1",
        rose: "#f43f5e",
        amber: "#f59e0b",
        palette: [
            "#8b5cf6", "#14b8a6", "#6366f1", "#f43f5e", "#f59e0b",
            "#3b82f6", "#ec4899", "#10b981", "#84cc16", "#a855f7"
        ]
    };
}

// Destroy all charts and re-render them
function renderCharts() {
    const colors = getChartThemeColors();
    
    // CHART 1: Average Score by District (Bar Chart)
    const districtScores = {};
    const districtStudents = {};
    filteredDataset.forEach(row => {
        const d = row["อำเภอที่ตั้งรร."];
        const students = parseInt(row["จำนวนผู้เข้าสอบ"]) || 0;
        const avg = row.__overallAvg || 0;
        if (d) {
            districtScores[d] = (districtScores[d] || 0) + (avg * students);
            districtStudents[d] = (districtStudents[d] || 0) + students;
        }
    });
    
    const districtList = Object.keys(districtScores).map(d => {
        const students = districtStudents[d];
        return {
            name: d,
            avg: students > 0 ? (districtScores[d] / students) : 0
        };
    }).sort((a,b) => b.avg - a.avg).slice(0, 15); // Show top 15 districts
    
    if (charts.districtMean) charts.districtMean.destroy();
    
    const ctx1 = document.getElementById("chartDistrictMean").getContext("2d");
    charts.districtMean = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: districtList.map(d => d.name),
            datasets: [{
                label: 'คะแนนเฉลี่ย',
                data: districtList.map(d => d.avg),
                backgroundColor: colors.primary,
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) { return `คะแนนเฉลี่ย: ${context.parsed.y.toFixed(2)}`; }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text, font: { family: 'Kanit' } }
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text, font: { family: 'Inter' } }
                }
            }
        }
    });

    // CHART 2: Student Distribution by Affiliation (Doughnut)
    const affiliationStudents = {};
    filteredDataset.forEach(row => {
        const aff = row["สังกัด"] || "อื่นๆ";
        const students = parseInt(row["จำนวนผู้เข้าสอบ"]) || 0;
        affiliationStudents[aff] = (affiliationStudents[aff] || 0) + students;
    });
    
    const affLabels = Object.keys(affiliationStudents);
    const affData = Object.values(affiliationStudents);
    
    const cleanLabels = affLabels.map(label => {
        if (label.includes("คณะกรรมการการศึกษาขั้นพื้นฐาน")) return "สพฐ.";
        if (label.includes("คณะกรรมการส่งเสริมการศึกษาเอกชน")) return "เอกชน (สช.)";
        if (label.includes("ส่งเสริมการปกครองท้องถิ่น")) return "ท้องถิ่น (อปท.)";
        if (label.includes("ตำรวจตระเวนชายแดน")) return "ตชด.";
        return label;
    });
    
    if (charts.affiliationRatio) charts.affiliationRatio.destroy();
    const ctx2 = document.getElementById("chartAffiliationRatio").getContext("2d");
    charts.affiliationRatio = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: cleanLabels,
            datasets: [{
                data: affData,
                backgroundColor: colors.palette,
                borderWidth: 1,
                borderColor: document.documentElement.getAttribute("data-theme") === "dark" ? "#1e293b" : "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: colors.text, font: { family: 'Kanit', size: 11 } }
                }
            }
        }
    });

    // CHART 3: Learning Standards Average (Horizontal Bar)
    const stdSum = {};
    const stdStudents = {};
    
    filteredDataset.forEach(row => {
        const students = parseInt(row["จำนวนผู้เข้าสอบ"]) || 0;
        scoreColumns.forEach((col, idx) => {
            const std = stdColumns[idx];
            const score = parseFloat(row[col]);
            if (!isNaN(score) && students > 0) {
                stdSum[std] = (stdSum[std] || 0) + (score * students);
                stdStudents[std] = (stdStudents[std] || 0) + students;
            }
        });
    });
    
    const stdDataList = stdColumns.map(std => {
        const students = stdStudents[std] || 0;
        return {
            name: std,
            avg: students > 0 ? (stdSum[std] / students) : 0
        };
    });
    
    if (charts.standardsMean) charts.standardsMean.destroy();
    const ctx3 = document.getElementById("chartStandardsMean").getContext("2d");
    charts.standardsMean = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: stdDataList.map(s => s.name),
            datasets: [{
                label: 'คะแนนเฉลี่ย',
                data: stdDataList.map(s => s.avg),
                backgroundColor: colors.secondary,
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    right: 35
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) { return `คะแนนเฉลี่ย: ${context.parsed.x.toFixed(2)}`; }
                    }
                },
                datalabels: {
                    display: true,
                    align: 'end',
                    anchor: 'end',
                    color: colors.text,
                    offset: 4,
                    font: {
                        family: 'Kanit',
                        weight: 'bold',
                        size: 11
                    },
                    formatter: function(value) {
                        return value !== null ? value.toFixed(2) : '';
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text, font: { family: 'Inter' } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: colors.text, font: { family: 'Inter', weight: 'bold' } }
                }
            }
        }
    });

    // CHART 6: Standards Trend (Line Chart) over years
    const districtVal = document.getElementById("filterDistrict").value;
    const sizeVal = document.getElementById("filterSize").value;
    const locationVal = document.getElementById("filterLocation").value;
    const affiliationVal = document.getElementById("filterAffiliation").value;
    
    const trendDataset = rawDataset.filter(row => {
        if (districtVal !== "all" && row["อำเภอที่ตั้งรร."] !== districtVal) return false;
        if (sizeVal !== "all" && row["ขนาดโรงเรียน"] !== sizeVal) return false;
        if (locationVal !== "all" && row["ที่ตั้งโรงเรียน"] !== locationVal) return false;
        if (affiliationVal !== "all" && row["สังกัด"] !== affiliationVal) return false;
        return true;
    });
    
    // Get unique years and sort ascending
    const trendYears = [...new Set(trendDataset.map(row => row.__year))].sort((a,b) => a-b);
    
    // Prepare standard datasets
    const standardTrends = {};
    stdColumns.forEach(std => {
        standardTrends[std] = [];
    });
    
    trendYears.forEach(year => {
        const yearRows = trendDataset.filter(row => row.__year == year);
        
        stdColumns.forEach((std, idx) => {
            const col = scoreColumns[idx];
            let sumStdScore = 0;
            let sumStudents = 0;
            
            yearRows.forEach(row => {
                const students = parseInt(row["จำนวนผู้เข้าสอบ"]) || 0;
                const score = parseFloat(row[col]);
                if (!isNaN(score) && students > 0) {
                    sumStdScore += (score * students);
                    sumStudents += students;
                }
            });
            
            const yearAvg = sumStudents > 0 ? (sumStdScore / sumStudents) : 0;
            standardTrends[std].push(yearAvg);
        });
    });
    
    if (charts.standardsTrend) charts.standardsTrend.destroy();
    const ctx6 = document.getElementById("chartStandardsTrend").getContext("2d");
    
    const lineColors = colors.palette;
    const datasets = stdColumns.map((std, idx) => {
        return {
            label: std,
            data: standardTrends[std],
            borderColor: lineColors[idx % lineColors.length],
            backgroundColor: lineColors[idx % lineColors.length],
            fill: false,
            tension: 0.15,
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });
    
    charts.standardsTrend = new Chart(ctx6, {
        type: 'line',
        data: {
            labels: trendYears.map(y => `ปีการศึกษา ${y}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: colors.text, font: { family: 'Kanit', size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) { return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} คะแนน`; }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text, font: { family: 'Kanit' } }
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text, font: { family: 'Inter' } },
                    min: 0,
                    max: 100
                }
            }
        }
    });

    // Dynamic Written Analysis
    const analysisDiv = document.getElementById("trendAnalysisContent");
    if (trendYears.length < 2) {
        analysisDiv.innerHTML = `
            <p style="color: var(--text-secondary);">
                <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-amber);"></i> 
                ข้อมูลในไฟล์นำเข้ามีเพียงปีการศึกษาเดียว หรือไม่มีข้อมูลปีการศึกษาอื่นๆ ไม่สามารถทำการวิเคราะห์เปรียบเทียบแนวโน้มในรอบหลายปีได้ 
                อย่างไรก็ตาม คะแนนเฉลี่ยสูงสุดในปัจจุบันคือมาตรฐาน <b>${stdColumns[0]}</b> และต่ำสุดคือมาตรฐาน <b>${stdColumns[stdColumns.length-1]}</b>
            </p>
        `;
    } else {
        const startYear = trendYears[0];
        const endYear = trendYears[trendYears.length - 1];
        
        let highest2568Std = "";
        let highest2568Val = -1;
        let lowest2568Std = "";
        let lowest2568Val = 999;
        
        let mostImprovedStd = "";
        let mostImprovedVal = -999;
        let mostDeclinedStd = "";
        let mostDeclinedVal = 999;
        
        const subjectMap = STANDARDS_DESC[currentSubject] || {};
        
        stdColumns.forEach(std => {
            const history = standardTrends[std];
            const startVal = history[0] || 0;
            const endVal = history[history.length - 1] || 0;
            const diff = endVal - startVal;
            
            // Check highest/lowest in latest year
            if (endVal > highest2568Val) {
                highest2568Val = endVal;
                highest2568Std = std;
            }
            if (endVal < lowest2568Val) {
                lowest2568Val = endVal;
                lowest2568Std = std;
            }
            
            // Check change trend
            if (diff > mostImprovedVal) {
                mostImprovedVal = diff;
                mostImprovedStd = std;
            }
            if (diff < mostDeclinedVal) {
                mostDeclinedVal = diff;
                mostDeclinedStd = std;
            }
        });
        
        const highestDesc = subjectMap[highest2568Std] || "มาตรฐานการเรียนรู้";
        const lowestDesc = subjectMap[lowest2568Std] || "มาตรฐานการเรียนรู้";
        const improvedDesc = subjectMap[mostImprovedStd] || "มาตรฐานการเรียนรู้";
        const declinedDesc = subjectMap[mostDeclinedStd] || "มาตรฐานการเรียนรู้";
        
        let analysisHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <p>จากการวิเคราะห์ข้อมูลแนวโน้มผลการทดสอบ O-NET วิชา ${currentSubject} ${currentGrade === "p6" ? "ป.6" : "ม.3"} ของกลุ่มเป้าหมายที่เลือก ในช่วงปีการศึกษา ${startYear} ถึง ${endYear} พบอินไซต์สำคัญที่สรุปได้ดังนี้ครับ:</p>
                <ul style="padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; line-height: 1.6;">
                    <li>
                        <strong style="color: var(--secondary);"><i class="fa-solid fa-circle-check"></i> จุดแข็งสำคัญในปัจจุบัน:</strong> 
                        มาตรฐาน <strong>${highest2568Std}</strong> (${highestDesc}) ทำคะแนนเฉลี่ยได้สูงสุดในปีล่าสุด (${endYear}) อยู่ที่ <strong>${highest2568Val.toFixed(2)}</strong> คะแนน สะท้อนว่ากระบวนการเรียนการสอนในสาระการเรียนรู้นี้บรรลุตัวชี้วัดเป็นอย่างดี
                    </li>
                    <li>
                        <strong style="color: var(--accent-indigo);"><i class="fa-solid fa-arrow-trend-up"></i> พัฒนาการดีเด่นที่สุด:</strong> 
                        มาตรฐาน <strong>${mostImprovedStd}</strong> (${improvedDesc}) มีอัตราการเติบโตของคะแนนสูงสุดในรอบ ${trendYears.length} ปีการศึกษา 
                        โดยเพิ่มขึ้นจาก <strong>${standardTrends[mostImprovedStd][0].toFixed(2)}</strong> ในปี ${startYear} เป็น <strong>${standardTrends[mostImprovedStd][trendYears.length-1].toFixed(2)}</strong> ในปี ${endYear} 
                        (เพิ่มขึ้นอย่างก้าวกระโดด <strong>+${mostImprovedVal.toFixed(2)}</strong> คะแนน)
                    </li>
        `;
        
        if (mostDeclinedVal < 0) {
            analysisHTML += `
                    <li>
                        <strong style="color: var(--accent-rose);"><i class="fa-solid fa-arrow-trend-down"></i> แนวโน้มลดลงที่ต้องเฝ้าระวัง:</strong> 
                        มาตรฐาน <strong>${mostDeclinedStd}</strong> (${declinedDesc}) เป็นกลุ่มสาระที่คะแนนมีแนวโน้มลดลงมากที่สุด 
                        โดยลดลงจากเฉลี่ย <strong>${standardTrends[mostDeclinedStd][0].toFixed(2)}</strong> ในปี ${startYear} เหลือเพียง <strong>${standardTrends[mostDeclinedStd][trendYears.length-1].toFixed(2)}</strong> ในปี ${endYear} 
                        (คะแนนตกลง <strong>${mostDeclinedVal.toFixed(2)}</strong> คะแนน) ควรวิจัยสาเหตุของปัญหาและปรับปรุงวิธีจัดกิจกรรมเชิงลึก
                    </li>
            `;
        } else {
            analysisHTML += `
                    <li>
                        <strong style="color: var(--accent-amber);"><i class="fa-solid fa-arrows-spin"></i> พัฒนาการคงที่/พัฒนาช้าที่สุด:</strong> 
                        มาตรฐาน <strong>${mostDeclinedStd}</strong> (${declinedDesc}) มีอัตราการเติบโตน้อยที่สุดในกลุ่มสาระ โดยคะแนนเฉลี่ยขยับขึ้นเพียง 
                        <strong>+${mostDeclinedVal.toFixed(2)}</strong> คะแนน ตลอดช่วงเวลาที่ผ่านมา
                    </li>
            `;
        }
        
        analysisHTML += `
                    <li>
                        <strong style="color: var(--accent-rose);"><i class="fa-solid fa-triangle-exclamation"></i> สาระการเรียนรู้ที่ควรเร่งพัฒนา:</strong> 
                        มาตรฐาน <strong>${lowest2568Std}</strong> (${lowestDesc}) มีคะแนนเฉลี่ยต่ำที่สุดในปีล่าสุด (${endYear}) อยู่ที่เพียง <strong>${lowest2568Val.toFixed(2)}</strong> คะแนน 
                        เป็นจุดอ่อนที่สถานศึกษาหรือฝ่ายวิชาการจำเป็นต้องระดมสื่อ ทรัพยากร และนวัตกรรมการสอนเข้ามาปรับปรุงกระบวนการสอนอย่างเร่งด่วน
                    </li>
                </ul>
                <div style="margin-top: 0.5rem; padding: 0.75rem 1rem; border-left: 4px solid var(--primary); background-color: rgba(139, 92, 246, 0.05); border-radius: 0 8px 8px 0; font-size: 0.92rem; line-height: 1.5;">
                    <strong><i class="fa-solid fa-lightbulb"></i> ข้อเสนอแนะเชิงกลยุทธ์:</strong> 
                    ขอแนะนำให้ทำการถอดบทเรียนความสำเร็จ (Best Practice) จากวิถีการสอนในมาตรฐาน <strong>${mostImprovedStd}</strong> เพื่อนำมาเป็นต้นแบบประยุกต์แก้ไขปัญหาสำหรับสาระการเรียนรู้ที่ยังทำผลงานได้ค่อนข้างน้อยอย่างมาตรฐาน <strong>${lowest2568Std}</strong> และติดตามพัฒนาการของมาตรฐานอื่นๆ อย่างสม่ำเสมอ
                </div>
            </div>
        `;
        
        analysisDiv.innerHTML = analysisHTML;
    }
}

// Update charts styles dynamically when theme changes
function updateChartsTheme() {
    const colors = getChartThemeColors();
    
    Object.keys(charts).forEach(key => {
        const chart = charts[key];
        if (!chart) return;
        
        // Update scale grid and text colors if scales exist
        if (chart.options.scales) {
            if (chart.options.scales.x) {
                if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = colors.text;
                if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = colors.grid;
            }
            if (chart.options.scales.y) {
                if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = colors.text;
                if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = colors.grid;
            }
        }
        
        // Update legend label colors if legends exist
        if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
            chart.options.plugins.legend.labels.color = colors.text;
        }
        
        // Update border colors for doughnut chart
        if (chart.config.type === 'doughnut') {
            const isDark = document.documentElement.getAttribute("data-theme") === "dark";
            chart.data.datasets[0].borderColor = isDark ? "#1e293b" : "#ffffff";
        }
        
        chart.update();
    });
}

// Resizes visible charts (fixes layout bug on tab switching)
function resizeVisibleCharts() {
    Object.keys(charts).forEach(key => {
        if (charts[key]) charts[key].resize();
    });
}

// Get Dataset filtered by search input in explorer
function getFilteredSearchDataset() {
    const searchVal = document.getElementById("schoolSearchInput").value.trim().toLowerCase();
    if (searchVal === "") return filteredDataset;
    
    return filteredDataset.filter(row => {
        return row["ชื่อโรงเรียน"] && row["ชื่อโรงเรียน"].toString().toLowerCase().includes(searchVal);
    });
}

// Render School Explorer Tab
function renderSchoolExplorer() {
    const tableBody = document.getElementById("schoolsTableBody");
    tableBody.innerHTML = "";
    
    const explorerDataset = getFilteredSearchDataset();
    const count = explorerDataset.length;
    
    if (count === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                    ไม่พบข้อมูลโรงเรียนตามที่ระบุ
                </td>
            </tr>
        `;
        document.getElementById("paginationInfo").textContent = "แสดง 0 - 0 จาก 0 รายการ";
        document.getElementById("btnPrevPage").disabled = true;
        document.getElementById("btnNextPage").disabled = true;
        return;
    }
    
    // Sort explorer dataset by score (descending)
    const sortedDataset = [...explorerDataset].sort((a,b) => b.__overallAvg - a.__overallAvg);
    
    const totalPages = Math.ceil(count / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, count);
    
    const pageItems = sortedDataset.slice(startIndex, endIndex);
    
    pageItems.forEach((row, index) => {
        const globalIndex = startIndex + index + 1;
        const size = row["ขนาดโรงเรียน"] || "-";
        const location = row["ที่ตั้งโรงเรียน"] || "-";
        
        let sizeBadge = "small";
        if (size === "กลาง") sizeBadge = "medium";
        else if (size === "ใหญ่") sizeBadge = "large";
        else if (size === "ใหญ่พิเศษ") sizeBadge = "xlarge";
        
        const locBadge = location === "ในเมือง" ? "in" : "out";
        
        // Shorten long affiliations
        let shortAff = row["สังกัด"] || "-";
        if (shortAff.includes("สพฐ")) shortAff = "สพฐ.";
        else if (shortAff.includes("ส่งเสริมการศึกษาเอกชน")) shortAff = "สช. (เอกชน)";
        else if (shortAff.includes("ส่งเสริมการปกครองท้องถิ่น")) shortAff = "อปท. (ท้องถิ่น)";
        else if (shortAff.includes("ตำรวจตระเวนชายแดน")) shortAff = "ตชด.";
        else if (shortAff.length > 25) shortAff = shortAff.substring(0, 25) + "...";
        
        tableBody.innerHTML += `
            <tr>
                <td style="font-family: var(--font-mono); font-size: 0.85rem;">${row.__year}</td>
                <td style="font-weight: 500;">${row["ชื่อโรงเรียน"]}</td>
                <td>${row["อำเภอที่ตั้งรร."] || "-"}</td>
                <td title="${row["สังกัด"]}">${shortAff}</td>
                <td style="font-family: var(--font-mono); text-align: center;">${parseInt(row["จำนวนผู้เข้าสอบ"]).toLocaleString()}</td>
                <td style="font-family: var(--font-mono); font-weight: 700; text-align: right; color: var(--primary);">
                    ${row.__overallAvg.toFixed(2)}
                </td>
                <td style="text-align: center;">
                    <button class="btn-view" onclick="viewSchoolDetails(${row.__id}, ${row.__year})">
                        <i class="fa-solid fa-chart-simple"></i> เจาะลึก
                    </button>
                </td>
            </tr>
        `;
    });
    
    // Update Pagination Info
    document.getElementById("paginationInfo").textContent = `แสดง ${startIndex + 1} - ${endIndex} จากทั้งหมด ${count} รายการ`;
    document.getElementById("btnPrevPage").disabled = currentPage === 1;
    document.getElementById("btnNextPage").disabled = currentPage === totalPages;
}

// Open and Render School Detail Card Modal
// Subject to Group mapping helper
const SUBJECT_GROUPS = {
    "วิทยาศาสตร์": "วิทยาศาสตร์และเทคโนโลยี",
    "คณิตศาสตร์": "คณิตศาสตร์",
    "ภาษาไทย": "ภาษาไทย",
    "อังกฤษ": "ภาษาต่างประเทศ"
};

window.viewSchoolDetails = function(rowId, year) {
    const schoolRecord = rawDataset.find(row => row.__id === rowId);
    if (!schoolRecord) return;
    
    const schoolName = schoolRecord["ชื่อโรงเรียน"];
    const district = schoolRecord["อำเภอที่ตั้งรร."];
    const affiliation = schoolRecord["สังกัด"];
    const size = schoolRecord["ขนาดโรงเรียน"];
    
    // Set header labels
    document.getElementById("modalSchoolName").textContent = schoolName;
    document.getElementById("modalSchoolDistrict").textContent = `อำเภอ${district} • ${affiliation} • โรงเรียนขนาด${size}`;
    
    // Find all historical records of the same school name
    const schoolRecords = rawDataset.filter(row => row["ชื่อโรงเรียน"] === schoolName);
    schoolRecords.sort((a, b) => parseInt(a.__year) - parseInt(b.__year));
    
    // Get all unique years in dataset
    const allYears = [...new Set(rawDataset.map(row => row.__year))].sort((a,b) => a-b);
    

    // Calculate standards timeline for sparkline charts
    const schoolStandardTrends = {};
    stdColumns.forEach(std => {
        schoolStandardTrends[std] = [];
    });
    
    // Filter out years where the school has records
    const activeYears = allYears.filter(y => schoolRecords.some(r => r.__year == y));
    
    activeYears.forEach(y => {
        const yearRecord = schoolRecords.find(row => row.__year == y);
        stdColumns.forEach((std, idx) => {
            const col = scoreColumns[idx];
            const val = yearRecord ? parseFloat(yearRecord[col]) : null;
            schoolStandardTrends[std].push(val);
        });
    });

    // Clear and populate sparkline grid
    const gridContainer = document.getElementById("schoolTrendChartsGrid");
    gridContainer.innerHTML = "";
    
    const colors = getChartThemeColors();
    
    stdColumns.forEach((std, idx) => {
        const cleanStd = std.replace(/\s+/g, "_");
        const standardDesc = (STANDARDS_DESC[currentSubject] && STANDARDS_DESC[currentSubject][std]) || "";
        
        const cardHtml = `
            <div class="card" style="padding: 0.75rem; background: var(--bg-main); border: 1px solid var(--border-card); display: flex; flex-direction: column; gap: 0.4rem; min-height: 220px;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--primary); font-family: var(--font-mono);">${std}</span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;" title="${standardDesc}">${standardDesc}</span>
                </div>
                <div style="flex-grow: 1; position: relative; width: 100%; height: 130px; margin-top: 0.25rem;">
                    <canvas id="chartSchoolTrend_${cleanStd}"></canvas>
                </div>
            </div>
        `;
        gridContainer.insertAdjacentHTML("beforeend", cardHtml);
        
        const ctxTrend = document.getElementById(`chartSchoolTrend_${cleanStd}`).getContext("2d");
        const chartKey = `trend_${cleanStd}`;
        if (charts[chartKey]) charts[chartKey].destroy();
        
        charts[chartKey] = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: activeYears.map(y => {
                    const yearRecord = schoolRecords.find(row => row.__year == y);
                    const studentCount = yearRecord ? (parseInt(yearRecord["จำนวนผู้เข้าสอบ"]) || 0) : 0;
                    return `${y} (${studentCount})`;
                }),
                datasets: [{
                    data: schoolStandardTrends[std],
                    borderColor: colors.palette[idx % colors.palette.length],
                    backgroundColor: colors.palette[idx % colors.palette.length],
                    fill: false,
                    tension: 0.15,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return `คะแนน: ${context.parsed.y.toFixed(2)}`; }
                        }
                    },
                    datalabels: {
                        display: true,
                        align: 'top',
                        anchor: 'end',
                        color: colors.text,
                        offset: 4,
                        font: {
                            family: 'Inter',
                            weight: 'bold',
                            size: 9
                        },
                        formatter: function(value) {
                            return value !== null ? value.toFixed(1) : '';
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text, font: { family: 'Inter', size: 9 } }
                    },
                    y: {
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { family: 'Inter', size: 9 } },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    });

    // Dynamic School Analysis & Recommendations
    const schoolAnalysisContent = document.getElementById("schoolAnalysisContent");
    const latestRecord = schoolRecords[schoolRecords.length - 1];
    const latestRecordYear = latestRecord.__year;

    // Find Strengths (school's own highest standard in latest year)
    let topRelStd = "";
    let topRelVal = -1;
    let bottomRelStd = "";
    let bottomRelVal = 999;
    
    stdColumns.forEach((std, idx) => {
        const col = scoreColumns[idx];
        const schoolScore = parseFloat(latestRecord[col]);
        if (!isNaN(schoolScore)) {
            if (schoolScore > topRelVal) {
                topRelVal = schoolScore;
                topRelStd = std;
            }
            if (schoolScore < bottomRelVal) {
                bottomRelVal = schoolScore;
                bottomRelStd = std;
            }
        }
    });

    // Find Stable Standard (least range change in scores across active years)
    let stableStd = "";
    let minRange = 999;
    
    if (activeYears.length >= 2) {
        stdColumns.forEach((std, idx) => {
            const history = schoolStandardTrends[std].filter(v => v !== null);
            if (history.length >= 2) {
                const range = Math.max(...history) - Math.min(...history);
                if (range < minRange) {
                    minRange = range;
                    stableStd = std;
                }
            }
        });
    }

    const subjectMap = STANDARDS_DESC[currentSubject] || {};
    const topDesc = subjectMap[topRelStd] || "มาตรฐานการเรียนรู้";
    const bottomDesc = subjectMap[bottomRelStd] || "มาตรฐานการเรียนรู้";
    const stableDesc = stableStd ? (subjectMap[stableStd] || "มาตรฐานการเรียนรู้") : "";
    
    let analysisHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            <p>สรุปประเมินสมรรถนะของ <strong>โรงเรียน${schoolName}</strong> ในวิชา ${currentSubject} ${currentGrade === "p6" ? "ป.6" : "ม.3"} จากข้อมูลย้อนหลังสะสม:</p>
            <ul style="padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; line-height: 1.6;">
                <li>
                    <strong style="color: var(--secondary);"><i class="fa-solid fa-circle-check"></i> จุดเด่นสำคัญ (มาตรฐานที่ทำคะแนนเฉลี่ยสูงสุด):</strong> 
                    มาตรฐาน <strong>${topRelStd}</strong> (${topDesc}) โดดเด่นที่สุดในการประเมินล่าสุด มีคะแนนเฉลี่ยปีการศึกษา ${latestRecordYear} อยู่ที่ 
                    <strong style="color: var(--secondary); font-size: 1.05rem;">${topRelVal.toFixed(2)}</strong> คะแนน สะท้อนว่าจัดกระบวนการเรียนรู้เรื่องนี้ได้ดีเยี่ยม
                </li>
                <li>
                    <strong style="color: var(--accent-rose);"><i class="fa-solid fa-circle-exclamation"></i> จุดที่ควรพัฒนาเร่งด่วน:</strong> 
                    มาตรฐาน <strong>${bottomRelStd}</strong> (${bottomDesc}) เป็นกลุ่มที่พบข้อจำกัดทางผลสัมฤทธิ์ โดยมีคะแนนเฉลี่ยปีล่าสุดอยู่ที่เพียง 
                    <strong>${bottomRelVal.toFixed(2)}</strong> คะแนน ฝ่ายวิชาการควรจัดเตรียมคลังสื่อและเสริมทักษะความรู้หัวข้อนี้อย่างเข้มข้น
                </li>
    `;
    
    if (activeYears.length >= 2 && stableStd) {
        const activeHistory = schoolStandardTrends[stableStd].filter(v => v !== null);
        const avgStable = activeHistory.reduce((a,b)=>a+b, 0) / activeHistory.length;
        
        analysisHTML += `
                <li>
                    <strong style="color: var(--accent-indigo);"><i class="fa-solid fa-anchor"></i> จุดที่มีคะแนนคงที่มากที่สุด (ความผันผวนต่ำสุด):</strong> 
                    มาตรฐาน <strong>${stableStd}</strong> (${stableDesc}) มีผลลัพธ์ในการสอบทรงตัวและสม่ำเสมอที่สุดในรอบหลายปีการศึกษา 
                    มีส่วนต่างของคะแนนสูงสุดและต่ำสุดตลอดปีการศึกษาเพียง <strong>${minRange.toFixed(2)}</strong> คะแนน (คะแนนเฉลี่ยสะสมอยู่ที่ <strong>${avgStable.toFixed(2)}</strong> คะแนน)
                </li>
        `;
    } else {
        analysisHTML += `
                <li>
                    <strong style="color: var(--text-muted);"><i class="fa-solid fa-circle-question"></i> จุดที่คงที่:</strong> 
                    ยังไม่สามารถวิเคราะห์จุดคงที่ย้อนหลังได้ เนื่องจากมีฐานข้อมูลบันทึกในระบบเพียง 1 ปีการศึกษา
                </li>
        `;
    }
    
    analysisHTML += `
            </ul>
            <div style="margin-top: 0.5rem; padding: 0.85rem 1rem; border-left: 4px solid var(--primary); background-color: rgba(139, 92, 246, 0.05); border-radius: 0 8px 8px 0; font-size: 0.92rem; line-height: 1.65;">
                <strong style="color: var(--primary); display: block; margin-bottom: 0.35rem;"><i class="fa-solid fa-lightbulb"></i> ข้อเสนอแนะเชิงกลยุทธ์สำหรับผู้บริหารและครูผู้สอน:</strong>
                1. <strong>ถอดบทเรียนจุดเด่น (Best Practice):</strong> ควรนำแนวทาง เทคนิค และกิจกรรมการสอนในมาตรฐาน <strong>${topRelStd}</strong> มาเป็นต้นแบบเพื่อถอดบทเรียนปรับปรุงและช่วยเหลือการสอนด้านอื่น<br>
                2. <strong>การยกระดับผลสัมฤทธิ์เร่งด่วน:</strong> มุ่งเน้นการจัดติวเข้มพิเศษ ใช้แบบฝึกหัดเชิงรุก (Active Learning) และเสริมสื่อที่เกี่ยวข้องในส่วนมาตรฐาน <strong>${bottomRelStd}</strong> เพื่อเตรียมตัวเข้าสู่การทดสอบครั้งถัดไป<br>
                ${stableStd ? `3. <strong>กระตุ้นผลคะแนนคงที่ (Unlock Plateau):</strong> สำหรับสาระที่ทรงตัวอย่างมาตรฐาน <strong>${stableStd}</strong> ควรปรับเปลี่ยนกระบวนการจัดกิจกรรมเพิ่มเติมนอกเหนือจากเนื้อหาแบบเดิมเพื่อสร้างความตื่นตัวในการคิดแก้ปัญหาของนักเรียนและปลดล็อกคะแนนให้สูงขึ้น` : ''}
            </div>
        </div>
    `;
    
    schoolAnalysisContent.innerHTML = analysisHTML;
    
    // Open Modal
    document.getElementById("schoolDetailModal").classList.add("active");
};

// PDF Downloader function using html2pdf.js
window.downloadSchoolPDF = function(schoolName) {
    const element = document.querySelector('.modal-card');
    if (!element) return;
    
    // Hide buttons
    const closeBtn = document.getElementById("modalCloseBtn");
    const dlBtn = document.getElementById("downloadPdfBtn");
    if (closeBtn) closeBtn.style.display = "none";
    if (dlBtn) dlBtn.style.display = "none";
    
    // Save original styles
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalTransform = element.style.transform;
    const originalMargin = element.style.margin;
    
    // Set fixed width for capture (Fits A4 landscape beautifully)
    element.style.width = "1020px";
    element.style.maxWidth = "1020px";
    element.style.transform = "none";
    element.style.margin = "0 auto";
    
    // Force browser reflow to update layout size in DOM immediately
    void element.offsetWidth;
    
    const modalBody = document.querySelector(".modal-body");
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflow = modalBody.style.overflowY;
    
    element.style.maxHeight = "none";
    modalBody.style.overflowY = "visible";
    
    // Force grid layouts to print styles (avoid wrapping)
    const gridContainer = document.getElementById("schoolTrendChartsGrid");
    const analysisBox = document.getElementById("schoolAnalysisBox");
    
    if (gridContainer) gridContainer.classList.add("print-force-grid");
    if (analysisBox) analysisBox.classList.add("print-page-break");
    
    // Force Chart.js to resize
    Object.keys(charts).forEach(key => {
        if (charts[key] && key.startsWith("trend_")) {
            charts[key].resize();
        }
    });
    
    const opt = {
        margin:       10,
        filename:     `ONET_Report_${schoolName || 'School'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0,
            width: 1020
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };
    
    setTimeout(() => {
        // Force Chart.js to resize to the final layed out container dimensions before capture
        Object.keys(charts).forEach(key => {
            if (charts[key] && key.startsWith("trend_")) {
                charts[key].resize();
            }
        });
        
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore styles
            element.style.width = originalWidth;
            element.style.maxWidth = originalMaxWidth;
            element.style.transform = originalTransform;
            element.style.margin = originalMargin;
            element.style.maxHeight = originalMaxHeight;
            modalBody.style.overflowY = originalOverflow;
            
            if (gridContainer) gridContainer.classList.remove("print-force-grid");
            if (analysisBox) analysisBox.classList.remove("print-page-break");
            
            // Resize back
            Object.keys(charts).forEach(key => {
                if (charts[key] && key.startsWith("trend_")) {
                    charts[key].resize();
                }
            });
            
            if (closeBtn) closeBtn.style.display = "block";
            if (dlBtn) dlBtn.style.display = "flex";
        }).catch(err => {
            console.error("PDF export failed:", err);
            // Restore even if error
            element.style.width = originalWidth;
            element.style.maxWidth = originalMaxWidth;
            element.style.transform = originalTransform;
            element.style.margin = originalMargin;
            element.style.maxHeight = originalMaxHeight;
            modalBody.style.overflowY = originalOverflow;
            
            if (gridContainer) gridContainer.classList.remove("print-force-grid");
            if (analysisBox) analysisBox.classList.remove("print-page-break");
            
            Object.keys(charts).forEach(key => {
                if (charts[key] && key.startsWith("trend_")) {
                    charts[key].resize();
                }
            });
            
            if (closeBtn) closeBtn.style.display = "block";
            if (dlBtn) dlBtn.style.display = "flex";
        });
    }, 500);
};
