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

// DOM Elements
const googleBtn = document.querySelector('.google-btn');
const loginForm = document.querySelector('.login-form');

// Google Sign In
googleBtn.addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        provider.setCustomParameters({
            'locale': navigator.language || 'en'
        });

        const result = await auth.signInWithPopup(provider);
        
        const user = result.user;
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        }));

        showMessage('Login successful!', 'success');
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Google Sign In Error:', error);
        
        let errorMessage = 'Error signing in with Google.';
        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage = 'Please allow popups for this website and try again.';
                break;
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign in was cancelled. Please try again.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMessage = 'An account already exists with this email using a different sign-in method.';
                break;
            default:
                errorMessage = error.message;
        }
        
        showMessage(errorMessage, 'error');
    }
});

// Email/Password Sign In
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    // التحقق من طول كلمة المرور
    if (password.length < 8) {
        showMessage('Password must be at least 8 characters long.');
        return;
    }
    
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        showMessage('Login successful!', 'success');
        window.location.href = 'dashboard.html';
    } catch (error) {
        let errorMessage = 'Error signing in. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'Invalid email or password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        showMessage(errorMessage);
    }
});

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    }
});

// إضافة وظيفة عرض الرسائل
function showMessage(message, type = 'error') {
    const messageContainer = document.querySelector('.message-container');
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = 'block';
} 