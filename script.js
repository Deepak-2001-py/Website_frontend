document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const CONFIG = {
        API: {
            API_ENDPOINT: '',
            GRADES_ENDPOINT: ''
        },
        UPLOAD: {
            MAX_FILE_SIZE_MB: 10,
            ALLOWED_FILE_TYPES: ['application/pdf'],
            TIMEOUT_MS: 60000,
            MAX_RETRIES: 2,
            RETRY_DELAY_MS: 2000
        },
        UI: {
            ALERT_TIMEOUT_MS: 5000,
            PROGRESS_HIDE_DELAY_MS: 3000
        }
    };

    // Utility Functions
    const Utils = {
        generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        formatFileSize(bytes) {
            if (bytes < 1024) return `${bytes} bytes`;
            if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${(bytes / 1048576).toFixed(1)} MB`;
        },

        sanitizeHTML(str) {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        }
    };

// Unified Tab Management System
const TabManager = {
    // Initialize all tab systems
    init() {
        // Primary Navigation Tabs
        this.setupTabSystem('.primary-nav .tab-btn', 'primary-nav');
        
        // Secondary Navigation Tabs (for View Grades section)
        this.setupTabSystem('.secondary-nav .tab-btn', 'secondary-nav');
    },

    // Generic tab setup method
    setupTabSystem(tabSelector, navType) {
        const tabButtons = document.querySelectorAll(tabSelector);
        
        tabButtons.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tabButtons, tab, navType);
            });
        });

        // Setup initial state
        this.setupInitialState(tabButtons, navType);
    },

    // Setup initial tab state
    setupInitialState(tabs, navType) {
        const activeTab = Array.from(tabs).find(tab => tab.classList.contains('active'));
        
        if (activeTab) {
            const targetId = activeTab.getAttribute('data-tab');
            const contentSections = this.getContentSections(navType);
            
            // Hide all sections
            contentSections.forEach(section => {
                section.classList.remove('active');
                section.setAttribute('aria-hidden', 'true');
                section.style.display = 'none';
            });
            
            // Show initial active section
            const initialSection = document.getElementById(targetId);
            if (initialSection) {
                initialSection.classList.add('active');
                initialSection.setAttribute('aria-hidden', 'false');
                initialSection.style.display = 'block';
            }
        }
    },

    // Switch between tabs
    switchTab(tabGroup, selectedTab, navType) {
        const targetId = selectedTab.getAttribute('data-tab');
        
        // Reset all tabs in this group
        tabGroup.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        // Activate selected tab
        selectedTab.classList.add('active');
        selectedTab.setAttribute('aria-selected', 'true');
        
        // Get content sections for this navigation type
        const contentSections = this.getContentSections(navType);
        
        // Hide all sections
        contentSections.forEach(section => {
            section.classList.remove('active');
            section.setAttribute('aria-hidden', 'true');
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.setAttribute('aria-hidden', 'false');
            targetSection.style.display = 'block';
        }
    },

    // Get content sections based on navigation type
    getContentSections(navType) {
        switch(navType) {
            case 'primary-nav':
                return document.querySelectorAll('.main-content > .container > .tab-content');
            case 'secondary-nav':
                return document.querySelectorAll('.sub-tab-content');
            default:
                return [];
        }
    }
};

// User Interface Manager
TabManager.init();


    // ---------- File Input and Drag & Drop Handling ----------
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const selectedFiles = new Set();

    fileInput.addEventListener('change', function() {
        const files = this.files;
        for (let i = 0; i < files.length; i++) {
            if (CONFIG.UPLOAD.ALLOWED_FILE_TYPES.includes(files[i].type)) {
                if (!validateFileSize(files[i], CONFIG.UPLOAD.MAX_FILE_SIZE_MB)) {
                    UIManager.showAlert(`File ${files[i].name} exceeds maximum size of ${CONFIG.UPLOAD.MAX_FILE_SIZE_MB}MB`, 'danger');
                    continue;
                }
                if (!selectedFiles.has(files[i].name)) {
                    selectedFiles.add(files[i].name);
                    addFileToList(files[i]);
                }
            } else {
                UIManager.showAlert(`File ${files[i].name} is not a PDF`, 'danger');
            }
        }
    });

    const fileInputLabel = document.querySelector('.file-upload-label');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileInputLabel.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileInputLabel.addEventListener(eventName, () => fileInputLabel.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileInputLabel.addEventListener(eventName, () => fileInputLabel.classList.remove('highlight'), false);
    });

    fileInputLabel.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        updateFileList(files);
    }

    function updateFileList(files) {
        for (let i = 0; i < files.length; i++) {
            if (CONFIG.UPLOAD.ALLOWED_FILE_TYPES.includes(files[i].type)) {
                if (!selectedFiles.has(files[i].name)) {
                    selectedFiles.add(files[i].name);
                    const li = document.createElement('li');
                    const span = document.createElement('span');
                    span.textContent = files[i].name;
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.innerHTML = '&times;';
                    removeBtn.addEventListener('click', function() {
                        li.remove();
                        selectedFiles.delete(files[i].name);
                    });
                    
                    li.appendChild(span);
                    li.appendChild(removeBtn);
                    fileList.appendChild(li);
                }
            }
        }
    }

    function validateFileSize(file, maxSizeMB) {
        const maxSize = maxSizeMB * 1024 * 1024;
        return file.size <= maxSize;
    }

    function addFileToList(file) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = `${file.name} (${Utils.formatFileSize(file.size)})`;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            li.remove();
            selectedFiles.delete(file.name);
        });
        
        li.appendChild(span);
        li.appendChild(removeBtn);
        fileList.appendChild(li);
    }

    function resetForm() {
        document.getElementById('upload-form').reset();
        fileList.innerHTML = '';
        selectedFiles.clear();
    }

    // ---------- Upload Form Submission ----------
    const uploadForm = document.getElementById('upload-form');
    const progressContainer = document.getElementById('progressContainer') || document.querySelector('.progress-container');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const progressText = progressContainer.querySelector('.progress-text');
    const alertContainer = document.getElementById('alert-container');

    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const uploadType = document.getElementById('upload-type').value;
        if (!uploadType) {
            UIManager.showAlert('Please select upload type', 'danger');
            return;
        }
        if (uploadType === 'student') {
            const assignmentId = document.getElementById('assignment-id').value;
            if (!assignmentId) {
                UIManager.showAlert('Please enter Assignment ID', 'danger');
                return;
            }
        }
        if (fileList.children.length === 0) {
            UIManager.showAlert('Please select at least one file', 'danger');
            return;
        }

        progressContainer.style.display = 'block';
        alertContainer.innerHTML = '';

        try {
            const metadata = {
                uploadType: uploadType,
                files: []
            };

            if (uploadType === 'student') {
                metadata.assignmentId = document.getElementById('assignment-id').value;
                const courseId = document.getElementById('course-id').value;
                if (courseId) {
                    metadata.courseId = courseId;
                }
                const studentIdField = document.getElementById('student-id');
                if (studentIdField && studentIdField.value) {
                    metadata.studentId = studentIdField.value;
                }
            }

            // Collect file information from the file input
            const fileInputFiles = fileInput.files;
            const filesToUpload = [];
            for (let i = 0; i < fileInputFiles.length; i++) {
                if (selectedFiles.has(fileInputFiles[i].name)) {
                    filesToUpload.push(fileInputFiles[i]);
                    metadata.files.push({
                        name: fileInputFiles[i].name,
                        type: fileInputFiles[i].type,
                        size: fileInputFiles[i].size
                    });
                }
            }

            const submitButton = uploadForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Uploading...';

            // Request presigned URLs from the server using the configured endpoint
            let response;
            try {
                response = await fetch(CONFIG.API.API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': window.location.origin
                    },
                    body: JSON.stringify(metadata),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error (${response.status}): ${errorText}`);
                }
            } catch (fetchError) {
                throw new Error(`Failed to connect to server: ${fetchError.message}`);
            }

            const presignedData = await response.json();

            const totalFiles = filesToUpload.length;
            let completedFiles = 0;
            let failedFiles = 0;

            const fileProgressElements = filesToUpload.map((file) => {
                const fileProgressDiv = document.createElement('div');
                fileProgressDiv.className = 'file-progress';
                fileProgressDiv.innerHTML = `
                    <p>${file.name} (0%)</p>
                    <div class="progress">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                `;
                progressContainer.appendChild(fileProgressDiv);
                return {
                    element: fileProgressDiv,
                    progressBar: fileProgressDiv.querySelector('.progress-bar'),
                    progressText: fileProgressDiv.querySelector('p')
                };
            });

            const uploadPromises = filesToUpload.map(async (file, index) => {
                const presignedUrl = presignedData.urls[index];
                const fileProgress = fileProgressElements[index];

                try {
                    await uploadFileWithPresignedUrl(file, presignedUrl, (progress) => {
                        fileProgress.progressBar.style.width = `${progress}%`;
                        fileProgress.progressText.textContent = `${file.name} (${progress}%)`;
                    });
                    completedFiles++;
                    updateTotalProgress(completedFiles, failedFiles, totalFiles);
                    return { success: true };
                } catch (error) {
                    failedFiles++;
                    fileProgress.element.classList.add('upload-failed');
                    fileProgress.progressText.textContent = `${file.name} (Failed: ${error.message})`;
                    updateTotalProgress(completedFiles, failedFiles, totalFiles);
                    return { success: false, error: error.message };
                }
            });

            const results = await Promise.all(uploadPromises);
            if (failedFiles === 0) {
                UIManager.showAlert('All files uploaded successfully!', 'success');
                resetForm();
            } else {
                UIManager.showAlert(`Upload completed with ${failedFiles} failed file(s) out of ${totalFiles}`, 'warning');
            }
        } catch (error) {
            UIManager.showAlert(`Upload failed: ${error.message}`, 'danger');
        } finally {
            setTimeout(() => {
                progressContainer.innerHTML = '';
                progressContainer.style.display = 'none';
            }, CONFIG.UI.PROGRESS_HIDE_DELAY_MS);

            const submitButton = uploadForm.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Upload Files';
        }
    });

    async function uploadFileWithPresignedUrl(file, presignedUrl, progressCallback) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.timeout = CONFIG.UPLOAD.TIMEOUT_MS;
            
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    progressCallback(percentComplete);
                }
            });
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`HTTP error ${xhr.status}: ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error occurred'));
            };
            
            xhr.ontimeout = function() {
                reject(new Error('Upload timed out'));
            };
            
            let retries = 0;
            const maxRetries = CONFIG.UPLOAD.MAX_RETRIES;
            function tryUpload() {
                try {
                    xhr.send(file);
                } catch (e) {
                    if (retries < maxRetries) {
                        retries++;
                        setTimeout(tryUpload, CONFIG.UPLOAD.RETRY_DELAY_MS);
                    } else {
                        reject(new Error(`Upload failed after ${maxRetries} retries`));
                    }
                }
            }
            tryUpload();
        });
    }

    function updateTotalProgress(completed, failed, total) {
        const percentComplete = Math.round(((completed + failed) / total) * 100);
        progressBar.style.width = percentComplete + '%';
        progressText.textContent = `${percentComplete}% (${completed}/${total} files)`;
    }

    // ---------- Grades Functionality ----------
        const studentViewBtn = document.getElementById("student-view-btn");
        const teacherViewBtn = document.getElementById("teacher-view-btn");
        const studentView = document.getElementById("student-view");
        const teacherView = document.getElementById("teacher-view");
      
        // Ensure student view is visible by default
        studentView.style.display = "block";
        teacherView.style.display = "none";
      
        // Set initial ARIA attributes
        studentViewBtn.setAttribute("aria-selected", "true");
        teacherViewBtn.setAttribute("aria-selected", "false");
      
        studentViewBtn.addEventListener("click", function () {
          studentView.style.display = "block";
          teacherView.style.display = "none";
      
          studentViewBtn.classList.add("active");
          teacherViewBtn.classList.remove("active");
      
          studentViewBtn.setAttribute("aria-selected", "true");
          teacherViewBtn.setAttribute("aria-selected", "false");
        });
      
        teacherViewBtn.addEventListener("click", function () {
          studentView.style.display = "none";
          teacherView.style.display = "block";
      
          teacherViewBtn.classList.add("active");
          studentViewBtn.classList.remove("active");
      
          teacherViewBtn.setAttribute("aria-selected", "true");
          studentViewBtn.setAttribute("aria-selected", "false");
        });
      
    
        // ---------- Grades Functionality ----------
    
        // // Student Grade Form (Student View)
        document.getElementById("student-grade-form").addEventListener("submit", function (event) {
            event.preventDefault();
            const studentId = document.getElementById("student-id").value.trim();
            const assignmentId = document.getElementById("assignment-id-student").value.trim();
            if (!studentId || !assignmentId) {
                UIManager.showAlert("Please fill in all required fields in student view", "danger");
                return;
            }
            fetchStudentGrades(studentId, assignmentId);
        });
    
        // Teacher Grade Form (Teacher View)
        document.getElementById("teacher-grade-form").addEventListener("submit", function (event) {
            event.preventDefault();
            const qpId = document.getElementById("qp-id").value.trim();
            const assignmentId = document.getElementById("assignment-id-teacher").value.trim();
            if (!qpId || !assignmentId) {
                UIManager.showAlert("Please fill in all required fields in teacher view", "danger");
                return;
            }
            fetchAllStudentGrades(qpId, assignmentId);
        });
    
        // Utility for API requests using the configured GRADES endpoint
        async function makeAPIRequest(data) {
            try {
                const response = await fetch(CONFIG.API.GRADES_ENDPOINT, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error("API request failed:", error);
                throw error;
            }
        }
    
        function showLoading(elementId) {
            document.getElementById(elementId).style.display = "block";
        }
    
        function hideLoading(elementId) {
            document.getElementById(elementId).style.display = "none";
        }
    
        function showResults(elementId) {
            document.getElementById(elementId).style.display = "block";
        }
    
        function hideResults(elementId) {
            document.getElementById(elementId).style.display = "none";
        }
    

        async function fetchStudentGrades(studentId, assignmentId) {
            const loader = document.getElementById("student-loader");
            showLoading("student-loader");
            
            try {

                const data = {
                    operation: "getSingleStudentGrade",
                    student_id: studentId,
                    assignment_id: assignmentId,
                };
            const response = await makeAPIRequest(data);

            displaySigleStudentSummary(response, assignmentId);
            displayDetails(response, assignmentId);
                
            } catch (error) {
                console.error("Grade fetch error:", error);
                UIManager.showAlert(`Failed to load grades: ${error.message}`, "danger");
            } finally {
                hideLoading("student-loader");
            }
        }
        
        
        // Fetch all student grades (Teacher View)
        async function fetchAllStudentGrades(qpId, assignmentId) {
            const loader = document.getElementById("teacher-loader");
            showLoading("teacher-loader");
            try {
                const data = {
                    operation: "getAllStudentGrades",
                    qp_id: qpId,
                    assignment_id: assignmentId,
                };
                const response = await makeAPIRequest(data);
                displayAllStudentGrades(response, assignmentId);
            } catch (error) {
                UIManager.showAlert(`Failed to fetch all grades: ${error.message}`, "danger");
            } finally {
                hideLoading("teacher-loader");
            }
        }
    
        function displayAllStudentGrades(data, assignmentId) {
            const studentsListElement = document.getElementById("students-list");
            const teacherResultContainer = document.getElementById("teacher-result");
            studentsListElement.innerHTML = "";
    
            let result;
            if (data && data.body) {
                try {
                    result = JSON.parse(data.body);
                } catch (error) {
                    UIManager.showAlert("Failed to parse grade data", "danger");
                    return;
                }
            } else {
                UIManager.showAlert("Invalid response from server", "danger");
                return;
            }
    
            if (!result.grades || !Array.isArray(result.grades)) {
                UIManager.showAlert("No grades available", "danger");
                return;
            }
    
            result.grades.forEach((grade) => {
                const row = document.createElement("tr");
                const dateStr = new Date(grade.timestamp * 1000).toLocaleString();
                row.innerHTML = `
                    <td>${grade.evaluation_id}</td>
                    <td>${grade.student_id}</td>
                    <td>${grade.qp_id}</td>
                    <td>${grade.total_marks}</td>
                    <td>${dateStr}</td>
                `;
                studentsListElement.appendChild(row);
            });
            teacherResultContainer.style.display = "block";
        }

        function displaySigleStudentSummary(data, assignmentId) {
            const summaryBody = document.getElementById("summary-body");
            const teacherResultContainer = document.getElementById("student-result");
            summaryBody.innerHTML = "";
    
            let result;
            if (data && data.body) {
                try {
                    result = JSON.parse(data.body);
                } catch (error) {
                    UIManager.showAlert("Failed to parse grade data", "danger");
                    return;
                }
            } else {
                UIManager.showAlert("Invalid response from server", "danger");
                return;
            }
    
            if (!result.summary || !Array.isArray(result.summary)) {
                UIManager.showAlert("No summary available", "danger");
                return;
            }
    
            result.summary.forEach((grade) => {
                const row = document.createElement("tr");
                const dateStr = new Date(grade.timestamp * 1000).toLocaleString();
                row.innerHTML = `
                <td>${grade.student_id || 'N/A'}</td>
                <td>${grade.assignment_id || 'N/A'}</td>
                <td>${grade.total_marks ?? 'N/A'}</td>
                <td>${grade.evaluation_id || 'N/A'}</td>
                <td>${grade.qp_id || 'N/A'}</td>
                <td>${dateStr}</td>
                `;
                summaryBody.appendChild(row);
            });
            teacherResultContainer.style.display = "block";
        }


        function displayDetails(data, assignmentId) {
            const questionsContainer = document.getElementById('questions-container');
            questionsContainer.innerHTML = ''; // Clear previous content
            let result;
            if (data && data.body) {
                try {
                    result = JSON.parse(data.body);
                } catch (error) {
                    UIManager.showAlert("Failed to parse grade data", "danger");
                    return;
                }
            } else {
                UIManager.showAlert("Invalid response from server", "danger");
                return;
            }
    
            if (!result.details || !Array.isArray(result.details)) {
                UIManager.showAlert("No details available", "danger");
                return;
            }
            // Create a function to render LaTeX if MathJax is available
            const renderLatex = (text) => {
                const tempDiv = document.createElement('div');
                tempDiv.textContent = text;
                
                // If MathJax is available, process the LaTeX
                if (window.MathJax) {
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, tempDiv]);
                }
                
                return tempDiv.innerHTML;
            };
        
            result.details.forEach((question) => {
                const questionCard = document.createElement('div');
                questionCard.className = 'question-card';
                questionCard.innerHTML = `
                <h3>Question ${question.question_number} ${question.subpart ? `(${question.subpart})` : ''}</h3>
                <p class="question-text">${renderLatex(question.question || 'Question not available')}</p>
                <div class="marks-info">
                    <span>Marks: <span class="obtained">${question.marks || 0}</span> / <span class="max">${question.max_marks || 0}</span></span>
                </div>
                <div class="answer-section">
                    <h4>Your Answer:</h4>
                    <p>${renderLatex(question.student_answer || 'No answer provided')}</p>
                </div>
                <div class="reasoning-section">
                    <h4>Feedback:</h4>
                    <p>${renderLatex(question.feedback || 'No additional reasoning provided')}</p>
                </div>
                `;
                questionsContainer.appendChild(questionCard);
            });
        
// Ensure MathJax is loaded and configured
if (!window.MathJax) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML';
    script.async = true;
    document.head.appendChild(script);
}
        }
        
    });
    
