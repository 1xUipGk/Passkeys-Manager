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
    const note = passwordForm.querySelector('input[name="note"]').value.trim();
    const editId = passwordForm.dataset.editId;

    try {
        if (!auth.currentUser) {
            throw new Error('You must be logged in to save passwords');
        }

        if (note.length > 100) {
            throw new Error('Note must not exceed 100 characters');
        }

        const userId = auth.currentUser.uid;
        const formData = {
            appName: modalSearchInput.value.trim(),
            username: passwordForm.querySelector('input[name="username"]').value.trim(),
            email: passwordForm.querySelector('input[name="email"]').value.trim(),
            password: password,
            note: note,
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
    
    if (unsubscribePasswords) {
        unsubscribePasswords();
    }

    unsubscribePasswords = passwordsRef.on('value', (snapshot) => {
        try {
            passwordsGrid.innerHTML = '';
            searchInput.value = ''; // إعادة تعيين حقل البحث
            
            if (!snapshot || snapshot.val() === null) {
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
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }
    });
}

// Add Password Card with improved styling
function addPasswordCard(data, passwordId) {
    const card = document.createElement('div');
    card.className = 'password-card';
    card.setAttribute('data-id', passwordId);
    
    // إضافة النص الإضافي (note) بعد اسم التطبيق
    const noteText = data.note ? ` - ${data.note}` : '';
    
    card.innerHTML = `
        <div class="card-header">
            <h3>${data.appName}${noteText}</h3>
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
    // إنشاء toast تأكيد الحذف
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

    toastContainer.appendChild(toast);

    // معالجة أزرار التأكيد والإلغاء
    return new Promise((resolve) => {
        const confirmBtn = toast.querySelector('.confirm-btn');
        const cancelBtn = toast.querySelector('.cancel-btn');

        confirmBtn.addEventListener('click', async () => {
            try {
                if (!auth.currentUser) {
                    throw new Error('You must be logged in');
                }

                const userId = auth.currentUser.uid;
                const passwordRef = database.ref(`passwords/${userId}/${passwordId}`);
                await passwordRef.remove();
                
                showToast('Password deleted successfully', 'success');
                toast.remove();
                resolve(true);
            } catch (error) {
                console.error('Delete error:', error);
                showToast(error.message || 'Error deleting password', 'error');
                toast.remove();
                resolve(false);
            }
        });

        cancelBtn.addEventListener('click', () => {
            toast.remove();
            resolve(false);
        });

        // إزالة toast بع 10 ثواني إذا لم يتم اتخاذ إجراء
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
                resolve(false);
            }
        }, 10000);
    });
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

        // إضاف زر العين بجانب حقل كلمة المرور
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
        passwordForm.querySelector('input[name="note"]').value = data.note || ''; // إضافة الملاحظة
        
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
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
    
    // Load data
    loadPasswords();
    loadApps();
    loadCommonSites();
    
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
const mobileSidebar = document.querySelector('.sidebar');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const closeSidebarBtn = document.querySelector('.close-sidebar');
let commonApps = [];
let unsubscribePasswords = null;
let unsubscribeApps = null;

// تحديث دالة loadCommonSites
function loadCommonSites() {
    try {
        // استخدام البيانات من sites-data.js مباشرة
        commonApps = sitesData.sites;
        updateAppsList();
        updateModalAppsList();
    } catch (error) {
        console.error('Error loading common sites:', error);
        showToast('Error loading sites list', 'error');
    }
}

// تحديث دالة updateAppsList
function updateAppsList() {
    const appsList = document.querySelector('.apps-list');
    if (!appsList) return;

    appsList.innerHTML = commonApps.map(app => `
        <div class="app-item" data-app="${app.name}">
            <img src="${app.icon}" alt="${app.name}" onerror="this.src='assets/images/default-icon.png'">
            <span>${app.name}</span>
        </div>
    `).join('');

    // إضافة ستمعي الأحداث
    appsList.querySelectorAll('.app-item').forEach(item => {
        item.addEventListener('click', () => {
            filterByApp(item.dataset.app);
        });
    });
}

// تحديث دالة updateModalAppsList
function updateModalAppsList() {
    const appsList = document.querySelector('.apps-suggestions');
    if (!appsList) {
        console.log('Apps list element not found');
        return;
    }

    // تحديث قائمة التطبيقات
    let html = commonApps.map(app => `
        <div class="app-suggestion" data-app="${app.name}">
            <img src="${app.icon}" alt="${app.name}" onerror="this.src='assets/images/default-icon.png'">
            <span>${app.name}</span>
        </div>
    `).join('');

    // إضافة خيارات إضافية
    html += `
        <div class="app-search-item new-site">
            <span class="material-symbols-outlined">add</span>
            <span>Add New Site</span>
        </div>
        <div class="app-search-item custom-domain">
            <span class="material-symbols-outlined">language</span>
            <span>Use Custom Domain</span>
        </div>
    `;

    appsList.innerHTML = html;
    appsList.style.display = 'none'; // إخفاء القائمة في البداية

    // إضافة مستمعي الأحداث
    appsList.querySelectorAll('.app-suggestion').forEach(item => {
        item.addEventListener('click', () => {
            if (modalSearchInput) {
                modalSearchInput.value = item.dataset.app;
                appsList.style.display = 'none';
            }
        });
    });

    // إضافة مستمعي الأحداث للخيارات الإضافية
    const newSiteBtn = appsList.querySelector('.new-site');
    const customDomainBtn = appsList.querySelector('.custom-domain');

    if (newSiteBtn && modalSearchInput) {
        newSiteBtn.addEventListener('click', () => {
            modalSearchInput.value = '';
            modalSearchInput.placeholder = 'Enter new site name...';
            modalSearchInput.focus();
            appsList.style.display = 'none';
        });
    }

    if (customDomainBtn && modalSearchInput) {
        customDomainBtn.addEventListener('click', () => {
            modalSearchInput.value = '';
            modalSearchInput.placeholder = 'Enter custom domain...';
            modalSearchInput.focus();
            appsList.style.display = 'none';
        });
    }
}

// تحديث متمع الأحداث للبحث
async function showCommonApps(query = '') {
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    
    // تصفية التطبيقات الموجودة
    const filteredApps = commonApps.filter(app => 
        app.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filteredApps.length > 0) {
        filteredApps.forEach(app => {
            const appItem = document.createElement('div');
            appItem.className = 'app-search-item';
            appItem.innerHTML = `
                <img src="${app.icon}" alt="${app.name}" onerror="this.src='assets/default-icon.png'">
                <span>${app.name}</span>
            `;
            appItem.addEventListener('click', () => {
                modalSearchInput.value = app.name;
                searchResults.remove();
            });
            searchResults.appendChild(appItem);
        });
    }
    
    // إضافة خيار إضافة موقع جديد
    const newSiteItem = document.createElement('div');
    newSiteItem.className = 'app-search-item new-site';
    newSiteItem.innerHTML = `
        <span class="material-symbols-outlined">add_circle</span>
        <span>Add new site</span>
    `;
    
    newSiteItem.addEventListener('click', () => {
        const siteName = query.trim();
        if (siteName) {
            const iconUrl = `https://www.google.com/s2/favicons?domain=${siteName.toLowerCase()}.com&sz=128`;
            const newApp = {
                name: siteName,
                icon: iconUrl,
                domains: [`${siteName.toLowerCase()}.com`],
                category: 'custom'
            };
            
            commonApps.push(newApp);
            modalSearchInput.value = siteName;
            searchResults.remove();
            updateModalAppsList();
            showToast(`Added "${siteName}" to the list`, 'success');
        }
    });
    
    searchResults.appendChild(newSiteItem);

    // إضافة خيار النطاق المخصص
    const customDomainItem = document.createElement('div');
    customDomainItem.className = 'app-search-item custom-domain';
    customDomainItem.innerHTML = `
        <span class="material-symbols-outlined">language</span>
        <span>Use custom domain</span>
    `;
    
    customDomainItem.addEventListener('click', () => {
        const customDomain = prompt('Enter the full domain (e.g., example.com):');
        if (customDomain) {
            const iconUrl = `https://www.google.com/s2/favicons?domain=${customDomain}&sz=128`;
            const newApp = {
                name: query.trim() || customDomain,
                icon: iconUrl,
                domains: [customDomain],
                category: 'custom'
            };
            
            commonApps.push(newApp);
            modalSearchInput.value = newApp.name;
            searchResults.remove();
            updateModalAppsList();
            showToast(`Added "${newApp.name}" with custom domain`, 'success');
        }
    });
    
    searchResults.appendChild(customDomainItem);

    // إضافة النتائج إلى واجهة المستخدم
    const searchSection = document.querySelector('.search-section');
    const existingResults = searchSection.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }
    searchSection.appendChild(searchResults);
}

// تحديث مستمع الأحداث للبحث
modalSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm) {
        showCommonApps(searchTerm);
    } else {
        const searchResults = document.querySelector('.search-results');
        if (searchResults) {
            searchResults.remove();
        }
    }
});

// إخفاء قائمة الاقتراحات عند النقر خارجها
document.addEventListener('click', (e) => {
    const appsList = document.querySelector('.apps-suggestions');
    if (appsList && !e.target.closest('.search-section')) {
        appsList.style.display = 'none';
    }
});

// تعريف دالة showToast إذا لم تكن موجودة
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'info'}</span>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// تحديث وظائف القائمة المتنقلة
if (mobileMenuBtn && mobileSidebar) {
    // فتح القائمة الجانبية
    mobileMenuBtn.addEventListener('click', () => {
        mobileSidebar.classList.add('active');
        document.body.style.overflow = 'hidden'; // منع التمرير عند فتح القائمة
    });

    // إغلاق القائمة الجانبية عند النقر على زر الإغلاق
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            mobileSidebar.classList.remove('active');
            document.body.style.overflow = ''; // إعادة تمكين التمرير
        });
    }

    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar') && 
            !e.target.closest('.mobile-menu-btn') && 
            mobileSidebar.classList.contains('active')) {
            mobileSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // منع انتشار النقر داخل القائمة الجانبية
    mobileSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// إضافة مستمع للتغيير في حجم النافذة
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) { // حجم الشاشة الذي تريد عنده إخفاء القائمة المتنقلة
        mobileSidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
});
// إضافة مستمع لأحداث التمرير للتأكد من إغلاق القائمة عند التمرير
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const st = window.pageYOffset || document.documentElement.scrollTop;
    if (st > lastScrollTop && mobileSidebar.classList.contains('active')) {
        mobileSidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
    lastScrollTop = st <= 0 ? 0 : st;
}, false);

// تعريف عنصر البحث
const searchInput = document.querySelector('.search-box input');

// إضافة مستمع للبحث المباشر
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterPasswords(searchTerm);
});

// دالة تصفية كلمات المرور
function filterPasswords(searchTerm) {
    const passwordCards = document.querySelectorAll('.password-card');
    
    passwordCards.forEach(card => {
        const appName = card.querySelector('.card-header h3').textContent.toLowerCase();
        const username = card.querySelector('.username').textContent.toLowerCase();
        const note = card.querySelector('.card-header h3').textContent.toLowerCase();
        
        // البحث في اسم التطبيق واسم المستخدم والملاحظة
        const isMatch = appName.includes(searchTerm) || 
                       username.includes(searchTerm) ||
                       note.includes(searchTerm);
        
        card.style.display = isMatch ? 'block' : 'none';
    });

    // إظهار رسالة إذا لم يتم العثور على نتائج
    const noResults = !Array.from(passwordCards)
        .some(card => card.style.display === 'block');

    showNoResults(noResults);
}

// دالة إظهار رسالة عدم وجود نتائج
function showNoResults(show) {
    let noResultsElement = document.querySelector('.no-results');
    
    if (show) {
        if (!noResultsElement) {
            noResultsElement = document.createElement('div');
            noResultsElement.className = 'no-results';
            noResultsElement.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-outlined">search_off</span>
                    <p>No passwords match your search</p>
                </div>
            `;
            passwordsGrid.appendChild(noResultsElement);
        }
    } else if (noResultsElement) {
        noResultsElement.remove();
    }
}

// Dark Mode Toggle
const themeToggleBtn = document.querySelector('.theme-toggle-btn');
const themeIcon = themeToggleBtn.querySelector('.material-symbols-outlined');
const themeText = themeToggleBtn.querySelector('.btn-text');

// تحقق من الوضع المحفوظ
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.textContent = 'dark_mode';
    themeText.textContent = 'Light Mode';
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // تحديث الأيقونة والنص
    themeIcon.textContent = isDarkMode ? 'dark_mode' : 'light_mode';
    themeText.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
    
    // حفظ التفضيل
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

