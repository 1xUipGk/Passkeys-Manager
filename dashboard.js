// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC-x3ugd_Bf2kzuKTblZJC3qCbB5T_NY2w",
    authDomain: "project-2957922020824939495.firebaseapp.com",
    databaseURL: "https://project-2957922020824939495-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-2957922020824939495",
    storageBucket: "project-2957922020824939495.appspot.com",
    messagingSenderId: "968070742990",
    appId: "1:968070742990:web:417b4f167f1038aa3ee19f",
    measurementId: "G-PPNWVETRJ8"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const addPasswordBtn = document.querySelector('.add-password-btn');
const modal = document.getElementById('addPasswordModal');
const closeBtn = document.querySelector('.close-btn');
const passwordForm = document.querySelector('.password-form');
const passwordsGrid = document.querySelector('.passwords-grid');
const generateBtn = document.querySelector('.generate-btn');
const modalSearchInput = document.querySelector('.search-section input');
const addNewAppBtn = document.querySelector('.add-new-app');
const logoutBtn = document.querySelector('.logout-btn');
const appsList = document.querySelector('.apps-list');
const modalToggleBtn = document.querySelector('.toggle-password');
const modalPasswordInput = document.querySelector('input[name="password"]');
const toastContainer = document.querySelector('.toast-container');

let isSubmitting = false; // Flag to prevent multiple submissions

// Modal Functions
addPasswordBtn.addEventListener('click', () => {
    modal.classList.add('active');
    passwordForm.reset();
    
    // Only try to reset the toggle button if it exists
    if (modalToggleBtn) {
        const toggleIcon = modalToggleBtn.querySelector('.material-symbols-outlined');
        if (toggleIcon) {
            toggleIcon.textContent = 'visibility_off';
            modalToggleBtn.classList.remove('active');
        }
    }
    
    if (modalPasswordInput) {
        modalPasswordInput.setAttribute('type', 'password');
    }
    
    // Reset the form state
    const saveBtn = passwordForm.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.textContent = 'Save';
    }
    delete passwordForm.dataset.editId;
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// Generate Random Password
generateBtn.addEventListener('click', () => {
    const password = generatePassword();
    passwordForm.querySelector('input[name="password"]').value = password;
});

function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Save Password
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modalElement = document.getElementById('addPasswordModal');
    const password = passwordForm.querySelector('input[name="password"]').value;
    const editId = passwordForm.dataset.editId;

    try {
        if (!auth.currentUser) {
            throw new Error('You must be logged in to save passwords');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        const userId = auth.currentUser.uid;
        const formData = {
            appName: modalSearchInput.value.trim(),
            username: passwordForm.querySelector('input[name="username"]').value.trim(),
            email: passwordForm.querySelector('input[name="email"]').value.trim(),
            password: password,
            userId: userId,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };

        // Only add createdAt for new entries, not updates
        if (!editId) {
            formData.createdAt = firebase.database.ServerValue.TIMESTAMP;
        }

        if (!formData.appName) {
            throw new Error('Please select or enter an app name');
        }

        let ref;
        if (editId) {
            // Update existing password
            ref = database.ref(`passwords/${userId}/${editId}`);
            await ref.update(formData);
        } else {
            // Add new password
            ref = database.ref(`passwords/${userId}`).push();
            await ref.set(formData);
        }

        // Reset form
        passwordForm.reset();
        delete passwordForm.dataset.editId;
        modalSearchInput.value = '';
        modalElement.classList.remove('active');
        
        showToast(editId ? 'Password updated successfully!' : 'Password saved successfully!', 'success');
        loadPasswords();

    } catch (error) {
        console.error('Error saving password:', error);
        showToast(error.message || 'Error saving password. Please try again.', 'error');
    }
});

// Load Passwords with Real-time Updates
function loadPasswords() {
    if (!auth.currentUser) {
        console.log('No authenticated user');
        return;
    }

    const userId = auth.currentUser.uid;
    const passwordsRef = database.ref(`passwords/${userId}`);
    
    // Unsubscribe from previous listener if exists
    if (unsubscribePasswords) {
        unsubscribePasswords();
    }

    unsubscribePasswords = passwordsRef.on('value', (snapshot) => {
        try {
            passwordsGrid.innerHTML = '';
            
            if (!snapshot || snapshot.val() === null) {
                // Handle empty state
                passwordsGrid.innerHTML = `
                    <div class="empty-state">
                        <p>No passwords saved yet</p>
                    </div>`;
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                addPasswordCard(data, childSnapshot.key);
            });
        } catch (error) {
            console.error('Error loading passwords:', error);
            showToast('Error loading passwords', 'error');
        } finally {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1000);
        }
    }, (error) => {
        console.error('Database error:', error);
        showToast('Error accessing database', 'error');
    });
}

// Add Password Card with improved styling
function addPasswordCard(data, passwordId) {
    const card = document.createElement('div');
    card.className = 'password-card';
    card.setAttribute('data-id', passwordId);
    card.innerHTML = `
        <div class="card-header">
            <h3>${data.appName}</h3>
        </div>
        <div class="card-content">
            <div class="app-icon">
                <img src="https://www.google.com/s2/favicons?domain=${data.appName.toLowerCase()}.com&sz=128" alt="${data.appName}">
            </div>
            <div class="credentials">
                <div class="user-info">
                    <p class="username">${data.email || data.username}</p>
                    <div class="password-input">
                        <input type="password" value="${data.password}" readonly>
                    </div>
                </div>
                <div class="actions">
                    <button class="toggle-password">
                        <span class="material-symbols-outlined">visibility_off</span>
                    </button>
                    <button class="copy-btn" onclick="copyPassword('${passwordId}')">
                        <span class="material-symbols-outlined">content_copy</span>
                    </button>
                    <div class="menu-dots">
                        <button class="menu-btn">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                        <div class="dropdown-menu">
                            <button onclick="editPassword('${passwordId}')">
                                <span class="material-symbols-outlined">edit</span>
                                Edit
                            </button>
                            <button onclick="deletePassword('${passwordId}')">
                                <span class="material-symbols-outlined">delete</span>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    
    // إضافة وظيفة إظهار/إخفاء كمة المرور
    const toggleBtn = card.querySelector('.toggle-password');
    const passwordInput = card.querySelector('.password-input input');
    const toggleIcon = toggleBtn.querySelector('.material-symbols-outlined');

    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type');
        passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
        toggleIcon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
        toggleBtn.classList.toggle('active');
    });


    // إضافة وظيفة القائمة المنسدلة
    const menuBtn = card.querySelector('.menu-btn');
    const dropdownMenu = card.querySelector('.dropdown-menu');

    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // إغلاق جميع القوائم المنسدلة الأخرى
            document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.classList.remove('active');
                }
            });
            dropdownMenu.classList.toggle('active');
        });
    }

    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-dots')) {
            dropdownMenu.classList.remove('active');
        }
    });

    passwordsGrid.appendChild(card);
}

// Format date helper
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}

// Load Apps List with Real-time Updates
function loadApps() {
    const passwordsRef = database.ref('passwords');
    
    passwordsRef.orderByChild('userId').equalTo(auth.currentUser.uid)
        .on('value', (snapshot) => {
            const apps = new Set();
            
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                apps.add(data.appName);
            });

            appsList.innerHTML = '';
            apps.forEach(app => {
                const appItem = document.createElement('div');
                appItem.className = 'app-item';
                appItem.innerHTML = `
                    <img src="https://www.google.com/s2/favicons?domain=${app.toLowerCase()}.com&sz=128" alt="${app}">
                    <span>${app}</span>
                `;
                appItem.addEventListener('click', () => filterByApp(app));
                appsList.appendChild(appItem);
            });
        });
}

// Filter passwords by app
function filterByApp(appName) {
    const cards = passwordsGrid.querySelectorAll('.password-card');
    cards.forEach(card => {
        const cardAppName = card.querySelector('.app-info h3').textContent;
        card.style.display = cardAppName === appName ? 'block' : 'none';
    });
}

async function copyPassword(passwordId) {
    // التحقق من حالة المصادقة
    if (!auth.currentUser) {
        showToast('You must be logged in', 'error');
        return;
    }

    try {
        // الحصول على كلمة المرور من قاعدة البيانات
        const userId = auth.currentUser.uid;
        const passwordRef = database.ref(`passwords/${userId}/${passwordId}`);
        const snapshot = await passwordRef.once('value');
        const passwordData = snapshot.val();

        // التحقق من وجود البيانات
        if (!passwordData || !passwordData.password) {
            throw new Error('Password not found');
        }

        // نسخ كلمة المرور إلى الحافظة
        await navigator.clipboard.writeText(passwordData.password);

        // تحدي واجهة المستخدم
        updateCopyButton(passwordId);
        
        // إظهار رسالة النجاح
        showToast('Password copied to clipboard', 'success');

    } catch (error) {
        console.error('Copy password error:', error);
        showToast(error.message || 'Failed to copy password', 'error');
    }
}

async function deletePassword(passwordId) {
    try {
        if (!auth.currentUser) {
            throw new Error('You must be logged in');
        }

        const userId = auth.currentUser.uid;
        console.log('Current User ID:', userId); // Log the user ID
        const passwordRef = database.ref(`passwords/${userId}/${passwordId}`);
        
        // Additional logging
        console.log('Password Path:', `passwords/${userId}/${passwordId}`);
        
        // Check if password exists
        const snapshot = await passwordRef.once('value');
        if (!snapshot.exists()) {
            throw new Error('Password not found');
        }

        // Rest of your existing code...
        await passwordRef.set(null);
    } catch (error) {
        console.error('Detailed Error:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack
        });
        showToast(error.message || 'Error deleting password', 'error');
        return false;
    }
}
// Edit Password
async function editPassword(passwordId) {
    try {
        if (!auth.currentUser) {
            throw new Error('You must be logged in');
        }

        const userId = auth.currentUser.uid;
        const modal = document.getElementById('addPasswordModal');
        const modalTitle = modal.querySelector('.modal-header h2');
        const saveBtn = modal.querySelector('.save-btn');
        
        // تحديث العنوان حسب الحالة
        modalTitle.textContent = 'Edit Password';
        saveBtn.textContent = 'Update';
        modal.classList.add('active');

        // إضافة زر العين بجانب حقل كلمة المرور
        const passwordField = passwordForm.querySelector('input[name="password"]');
        const existingEyeBtn = passwordForm.querySelector('.eye-btn');
        
        if (!existingEyeBtn) {
            const eyeBtn = document.createElement('button');
            eyeBtn.type = 'button';
            eyeBtn.className = 'eye-btn';
            eyeBtn.innerHTML = '<span class="material-symbols-outlined">visibility_off</span>';
            
            // إضافة الزر بعد حقل كلمة المرور
            passwordField.parentNode.insertBefore(eyeBtn, passwordField.nextSibling);
            
            // إضافة وظيفة التبديل
            eyeBtn.addEventListener('click', () => {
                const type = passwordField.getAttribute('type');
                passwordField.setAttribute('type', type === 'password' ? 'text' : 'password');
                eyeBtn.querySelector('.material-symbols-outlined').textContent = 
                    type === 'password' ? 'visibility' : 'visibility_off';
            });
        }
        
        const snapshot = await database.ref(`passwords/${userId}/${passwordId}`).once('value');
        const data = snapshot.val();
        
        if (!data) {
            throw new Error('Password not found');
        }
        
        modalSearchInput.value = data.appName || '';
        passwordForm.querySelector('input[name="username"]').value = data.username || '';
        passwordForm.querySelector('input[name="email"]').value = data.email || '';
        passwordForm.querySelector('input[name="password"]').value = data.password || '';
        
        passwordForm.dataset.editId = passwordId;
    } catch (error) {
        console.error('Error loading password data:', error);
        showToast(error.message || 'Error loading password data', 'error');
    }
}

// Search Functionality
modalSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const passwordsRef = database.ref('passwords');
    
    passwordsRef.orderByChild('userId').equalTo(auth.currentUser.uid)
        .once('value', (snapshot) => {
            passwordsGrid.innerHTML = '';
            
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.appName.toLowerCase().includes(searchTerm)) {
                    addPasswordCard(data, childSnapshot.key);
                }
            });
        });
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        showToast('Signed out successfully', 'success');
    } catch (error) {
        console.error('Error signing out:', error);
        showToast('Error signing out. Please try again.', 'error');
    }
});

// Check Authentication
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Show loading screen
    loadingScreen.classList.remove('hidden');
    
    // Load data
    loadPasswords();
    loadApps();
    
    // Update UI to show user info
    const userEmail = document.querySelector('.user-email');
    if (userEmail) {
        userEmail.textContent = user.email;
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (unsubscribePasswords) {
        unsubscribePasswords();
    }
    if (unsubscribeApps) {
        unsubscribeApps();
    }
});

// في بداية الملف، بعد تعريف المتغيرات
const loadingScreen = document.querySelector('.loading-screen');

// في بداية الملف، بعد تهيئة Firebase
let unsubscribePasswords = null;
let unsubscribeApps = null;

// حذف تعريف commonApps القديم واستبداله بمتغير فارغ
let commonApps = [];

// إضافة دالة لتحميل المواقع من الملف
async function loadCommonSites() {
    try {
        const response = await fetch('common-sites.json');
        const data = await response.json();
        commonApps = data.sites.map(site => ({
            name: site.name,
            icon: site.icon,
            domains: site.domains,
            category: site.category
        }));
    } catch (error) {
        console.error('Error loading common sites:', error);
        showToast('Error loading sites list', 'error');
    }
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadCommonSites);

