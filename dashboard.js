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

let isSubmitting = false; // Flag to prevent multiple submissions

// Modal Functions
addPasswordBtn.addEventListener('click', () => {
    modal.classList.add('active');
    passwordForm.reset();
    
    // إعادة تعيين أيقونة العين
    const toggleIcon = modalToggleBtn.querySelector('.material-symbols-outlined');
    toggleIcon.textContent = 'visibility_off';
    modalToggleBtn.classList.remove('active');
    modalPasswordInput.setAttribute('type', 'password');
    
    // Reset the form state
    const saveBtn = passwordForm.querySelector('.save-btn');
    saveBtn.textContent = 'Save';
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
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Save Password
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modalElement = document.getElementById('addPasswordModal');

    try {
        if (!auth.currentUser) {
            throw new Error('You must be logged in to save passwords');
        }

        const userId = auth.currentUser.uid;
        const formData = {
            appName: modalSearchInput.value.trim(),
            username: passwordForm.querySelector('input[name="username"]').value.trim(),
            email: passwordForm.querySelector('input[name="email"]').value.trim(),
            password: passwordForm.querySelector('input[name="password"]').value,
            userId: userId,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        if (!formData.appName) {
            throw new Error('Please select or enter an app name');
        }

        // Save to Realtime Database under user's ID
        const newPasswordRef = database.ref(`passwords/${userId}`).push();
        await newPasswordRef.set(formData);

        // Reset form and hide modal
        passwordForm.reset();
        modalSearchInput.value = '';
        modalElement.classList.remove('active');
        
        showToast('Password saved successfully!', 'success');

        // Reload passwords
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
            
            if (!snapshot.exists()) {
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

    
    // إضافة وظيفة إظهار/إخفاء ك��مة المرور
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

// Copy Password
async function copyPassword(passwordId) {
    try {
        if (!auth.currentUser) {
            throw new Error('You must be logged in');
        }

        const userId = auth.currentUser.uid;
        const snapshot = await database.ref(`passwords/${userId}/${passwordId}`).once('value');
        const data = snapshot.val();
        
        if (!data) {
            throw new Error('Password not found');
        }

        await navigator.clipboard.writeText(data.password);
        
        const copyBtn = document.querySelector(`[onclick="copyPassword('${passwordId}')"]`);
        const icon = copyBtn.querySelector('.material-symbols-outlined');
        
        icon.textContent = 'check_circle';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            icon.textContent = 'content_copy';
            copyBtn.classList.remove('copied');
        }, 2000);

        showToast('Password copied to clipboard', 'success');
    } catch (error) {
        console.error('Error copying password:', error);
        showToast(error.message || 'Error copying password', 'error');
    }
}

// Delete Password
async function deletePassword(passwordId) {
    try {
        if (!auth.currentUser) {
            throw new Error('You must be logged in');
        }

        const userId = auth.currentUser.uid;
        const toast = document.createElement('div');
        toast.className = 'toast warning';
        toast.innerHTML = `
            <span class="material-symbols-outlined toast-icon">delete</span>
            <div class="toast-content">
                <p class="toast-message">Delete Password</p>
                <p class="toast-submessage">Are you sure you want to delete this password?</p>
                <div class="toast-actions">
                    <button class="confirm-btn">Delete</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        const container = document.querySelector('.toast-container');
        container.appendChild(toast);

        const confirmBtn = toast.querySelector('.confirm-btn');
        const cancelBtn = toast.querySelector('.cancel-btn');

        confirmBtn.addEventListener('click', async () => {
            try {
                await database.ref(`passwords/${userId}/${passwordId}`).remove();
                toast.remove();
                showToast('Password deleted successfully', 'success');
            } catch (error) {
                console.error('Error deleting password:', error);
                showToast('Error deleting password', 'error');
            }
        });

        cancelBtn.addEventListener('click', () => {
            toast.remove();
        });
    } catch (error) {
        console.error('Error initiating delete:', error);
        showToast(error.message || 'Error deleting password', 'error');
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
        
        modalTitle.textContent = 'Edit Password';
        saveBtn.textContent = 'Update';
        modal.classList.add('active');
        
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

// تحديث قائمة التطبيقات الجاهزة مع روابط أيقونات أفضل
const commonApps = [
    { name: 'Google', icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=128' },
    { name: 'Facebook', icon: 'https://www.google.com/s2/favicons?domain=facebook.com&sz=128' },
    { name: 'Twitter', icon: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=128' },
    { name: 'Instagram', icon: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128' },
    { name: 'LinkedIn', icon: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=128' },
    { name: 'GitHub', icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=128' },
    { name: 'Microsoft', icon: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128' },
    { name: 'Apple', icon: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128' },
    { name: 'Amazon', icon: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128' },
    { name: 'Netflix', icon: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=128' }
];

// تديث الافذة المنبثقة لعرض التطبيقات الجاهزة
function showCommonApps() {
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    
    commonApps.forEach(app => {
        const appItem = document.createElement('div');
        appItem.className = 'app-search-item';
        appItem.innerHTML = `
            <img src="${app.icon}" alt="${app.name}">
            <span>${app.name}</span>
        `;
        appItem.addEventListener('click', () => {
            modalSearchInput.value = app.name;
            searchResults.remove();
        });
        searchResults.appendChild(appItem);
    });

    const searchSection = document.querySelector('.search-section');
    // Remove existing search results if any
    const existingResults = searchSection.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }
    searchSection.appendChild(searchResults);
}

// تحديث event listener للبحث
modalSearchInput.addEventListener('focus', showCommonApps);

// إخفاء نتائج البحث عن النقر خارجها
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.remove();
        }
    }
});

// أضف هذه الوظيفة في بداية الملف بعد تعريف المتغيرات
const toastContainer = document.querySelector('.toast-container');

// إخفاء toast-container عند بداية تحميل الصفحة
toastContainer.style.display = 'none';

// إظهار toast-container بعد 5 ثواني
setTimeout(() => {
    toastContainer.style.display = 'block';
}, 5000);

// تحديث وظيفة showToast للتحقق من حالة العرض
function showToast(message, type = 'info') {
    // التحقق من حالة العرض قبل إظهار التنبيه
    if (toastContainer.style.display === 'none') {
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon;
    switch(type) {
        case 'success':
            icon = 'check_circle';
            break;
        case 'error':
            icon = 'error';
            break;
        default:
            icon = 'info';
    }
    
    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon">${icon}</span>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Mobile Menu Functions
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const closeSidebarBtn = document.querySelector('.close-sidebar');
const sidebar = document.querySelector('.sidebar');

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !mobileMenuBtn.contains(e.target) && 
        sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
});

// Main Search Function
const mainSearchInput = document.querySelector('.search-box input');
mainSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.password-card');
    
    cards.forEach(card => {
        const appName = card.querySelector('.card-header h3').textContent.toLowerCase();
        const username = card.querySelector('.username').textContent.toLowerCase();
        
        if (appName.includes(searchTerm) || username.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Common Apps Search
const searchSection = document.querySelector('.search-section');

modalSearchInput.addEventListener('focus', () => {
    showCommonApps();
});

modalSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const searchResults = document.querySelector('.search-results');
    
    if (searchResults) {
        const items = searchResults.querySelectorAll('.app-search-item');
        items.forEach(item => {
            const appName = item.querySelector('span').textContent.toLowerCase();
            if (appName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
});

// Password Generator with Options
function generatePassword(length = 16, options = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
}) {
    const chars = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let availableChars = '';
    Object.keys(options).forEach(key => {
        if (options[key]) {
            availableChars += chars[key];
        }
    });

    let password = '';
    for (let i = 0; i < length; i++) {
        password += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
    }

    return password;
}

// Enhanced Copy Function
async function copyPassword(passwordId) {
    try {
        const snapshot = await database.ref('passwords/' + passwordId).once('value');
        const data = snapshot.val();
        await navigator.clipboard.writeText(data.password);
        
        const copyBtn = document.querySelector(`[onclick="copyPassword('${passwordId}')"]`);
        const icon = copyBtn.querySelector('.material-symbols-outlined');
        
        icon.textContent = 'check_circle';
        icon.style.fontVariationSettings = "'FILL' 1";
        copyBtn.style.color = '#4CAF50';
        
        setTimeout(() => {
            icon.textContent = 'content_copy';
            icon.style.fontVariationSettings = '';
            copyBtn.style.color = '';
        }, 2000);

        showToast('Password copied to clipboard', 'success');
    } catch (error) {
        console.error('Error copying password:', error);
        showToast('Error copying password', 'error');
    }
}

// Enhanced Delete Function
async function deletePassword(passwordId) {
    const toast = document.createElement('div');
    toast.className = 'toast warning';
    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon">delete</span>
        <div class="toast-content">
            <p class="toast-message">Delete Password</p>
            <p class="toast-submessage">Are you sure you want to delete this password?</p>
            <div class="toast-actions">
                <button class="confirm-btn">Delete</button>
                <button class="cancel-btn">Cancel</button>
            </div>
        </div>
    `;
    
    const container = document.querySelector('.toast-container');
    container.appendChild(toast);

    const confirmBtn = toast.querySelector('.confirm-btn');
    const cancelBtn = toast.querySelector('.cancel-btn');

    return new Promise((resolve) => {
        confirmBtn.addEventListener('click', async () => {
            try {
                await database.ref('passwords/' + passwordId).remove();
                toast.remove();
                showToast('Password deleted successfully', 'success');
                resolve(true);
            } catch (error) {
                console.error('Error deleting password:', error);
                showToast('Error deleting password', 'error');
                resolve(false);
            }
        });

        cancelBtn.addEventListener('click', () => {
            toast.remove();
            resolve(false);
        });
    });
}// Enhanced Toast Function
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon;
    switch(type) {
        case 'success':
            icon = 'check_circle';
            break;
        case 'error':
            icon = 'error';
            break;
        case 'warning':
            icon = 'warning';
            break;
        default:
            icon = 'info';
    }
    
    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon">${icon}</span>
        <div class="toast-content">
            <p class="toast-message">${message}</p>
        </div>
    `;
    
    const container = document.querySelector('.toast-container');
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Cleanup Function
function cleanup() {
    if (unsubscribePasswords) {
        unsubscribePasswords();
    }
    if (unsubscribeApps) {
        unsubscribeApps();
    }
}

// Event Listeners for Cleanup
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            loadPasswords();
            loadApps();
        }
    });
});

