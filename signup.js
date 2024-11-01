function showMessage(message, type = 'error') {
    const messageContainer = document.querySelector('.message-container');
    messageContainer.textContent = message;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = 'block';
}

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
const signupForm = document.querySelector('.signup-form');

// Google Sign Up
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

        showMessage('Account created successfully!', 'success');
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Google Sign Up Error:', error);
        
        let errorMessage = 'Error signing up with Google.';
        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage = 'Please allow popups for this website and try again.';
                break;
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign up was cancelled. Please try again.';
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

// Email/Password Sign Up
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = signupForm.querySelector('input[name="email"]').value;
    const password = signupForm.querySelector('input[name="password"]').value;

    // التحقق من طول كلمة المرور
    if (password.length < 8) {
        showMessage('Password must be at least 8 characters long.');
        return;
    }

    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        showMessage('Account created successfully!', 'success');
        window.location.href = 'dashboard.html';
    } catch (error) {
        let errorMessage = 'Error creating account. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password must be at least 8 characters long.';
                break;
        }
        
        showMessage(errorMessage);
    }
});

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, redirect to dashboard
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    }
}); 