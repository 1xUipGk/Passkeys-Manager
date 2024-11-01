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
const searchInput = document.querySelector('.search-section input');
const addNewAppBtn = document.querySelector('.add-new-app');
const logoutBtn = document.querySelector('.logout-btn');
const appsList = document.querySelector('.apps-list');

let isSubmitting = false; // Flag to prevent multiple submissions

// Modal Functions
addPasswordBtn.addEventListener('click', () => {
    modal.classList.add('active');
    passwordForm.reset();
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

        const formData = {
            appName: searchInput.value.trim(),
            username: passwordForm.querySelector('input[name="username"]').value.trim(),
            email: passwordForm.querySelector('input[name="email"]').value.trim(),
            password: passwordForm.querySelector('input[name="password"]').value,
            userId: auth.currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        if (!formData.appName) {
            throw new Error('Please select or enter an app name');
        }

        // Save to Realtime Database
        const newPasswordRef = database.ref('passwords').push();
        await newPasswordRef.set(formData);

        // Reset form and hide modal
        passwordForm.reset();
        searchInput.value = '';
        modalElement.classList.remove('active');
        
        // Show success message
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
    const passwordsRef = database.ref('passwords');
    
    passwordsRef.orderByChild('userId').equalTo(auth.currentUser.uid)
        .once('value', (snapshot) => {
            passwordsGrid.innerHTML = '';
            
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                addPasswordCard(data, childSnapshot.key);
            });

            // إخفاء شاشة التحميل بعد تحميل البيانات
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1000);
        });
}

// Add Password Card with improved styling
function addPasswordCard(data, passwordId) {
    const card = document.createElement('div');
    card.className = 'password-card';
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
                    <input type="password" value="${data.password}" readonly class="password-input">
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

    // إضافة وظيفة إظهار/إخفاء كلمة المرور
    const toggleBtn = card.querySelector('.toggle-password');
    const passwordInput = card.querySelector('.password-input');
    const toggleIcon = toggleBtn.querySelector('.material-symbols-outlined');

    toggleBtn.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = 'visibility';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = 'visibility_off';
        }
    });

    // إضافة وظيفة القائمة المنسدلة
    const menuBtn = card.querySelector('.menu-btn');
    const dropdownMenu = card.querySelector('.dropdown-menu');

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('active');
    });

    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('active');
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
        const snapshot = await database.ref('passwords/' + passwordId).once('value');
        const data = snapshot.val();
        await navigator.clipboard.writeText(data.password);
        
        // تحديث الأيقونة
        const copyBtn = document.querySelector(`[onclick="copyPassword('${passwordId}')"]`);
        const icon = copyBtn.querySelector('.material-symbols-outlined');
        const originalIcon = icon.textContent;
        
        // تغيير الأيقونة وإضافة الكلاس
        icon.textContent = 'check_circle';
        copyBtn.classList.add('copied');
        
        // إعادة الأيقونة الأصلية بعد ثانيتين
        setTimeout(() => {
            icon.textContent = originalIcon;
            copyBtn.classList.remove('copied');
        }, 2000);

        showToast('Password copied to clipboard', 'success');
    } catch (error) {
        console.error('Error copying password:', error);
        showToast('Error copying password', 'error');
    }
}

// Delete Password
async function deletePassword(passwordId) {
    const toast = document.createElement('div');
    toast.className = 'toast warning';
    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon">delete</span></br>
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
            await database.ref('passwords/' + passwordId).remove();
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
}

// Edit Password
async function editPassword(passwordId) {
    try {
        const snapshot = await database.ref('passwords/' + passwordId).once('value');
        const data = snapshot.val();
        
        searchInput.value = data.appName;
        passwordForm.querySelector('input[name="username"]').value = data.username || '';
        passwordForm.querySelector('input[name="email"]').value = data.email || '';
        passwordForm.querySelector('input[name="password"]').value = data.password;
        
        const saveBtn = passwordForm.querySelector('.save-btn');
        saveBtn.textContent = 'Update';
        
        passwordForm.dataset.editId = passwordId;
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading password data:', error);
        showToast('Error loading password data', 'error');
    }
}

// Search Functionality
searchInput.addEventListener('input', (e) => {
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
    } else {
        // إظهار شاشة التحميل
        loadingScreen.classList.remove('hidden');
        loadPasswords();
        loadApps();
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
            searchInput.value = app.name;
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
searchInput.addEventListener('focus', showCommonApps);

// إخفاء نتائج البحث عند النقر خارجها
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