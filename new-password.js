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

// Get action code from URL
function getParameterByName(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const actionCode = getParameterByName('oobCode');

// DOM Elements
const form = document.querySelector('.new-password-form');
const passwordInput = form.querySelector('input[name="password"]');
const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');

// Handle Password Reset
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // التحقق من طول كلمة المرور
    if (password.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        // التحقق من صحة رمز إعادة تعيين كلمة المرور
        await auth.verifyPasswordResetCode(actionCode);
        
        // تأكيد إعادة تعيين كلمة المرور
        await auth.confirmPasswordReset(actionCode, password);
        
        alert('Password has been updated successfully!');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error updating password:', error);
        let errorMessage = 'Error updating password. Please try again.';
        
        switch (error.code) {
            case 'auth/expired-action-code':
                errorMessage = 'The password reset link has expired. Please request a new one.';
                break;
            case 'auth/invalid-action-code':
                errorMessage = 'Invalid password reset link. Please request a new one.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password must be at least 8 characters long.';
                break;
        }
        
        alert(errorMessage);
    }
});

// Verify action code when page loads
if (actionCode) {
    auth.verifyPasswordResetCode(actionCode).catch(error => {
        console.error('Error verifying reset code:', error);
        alert('Invalid or expired password reset link. Please request a new one.');
        window.location.href = 'login.html';
    });
} else {
    alert('Invalid password reset link. Please request a new one.');
    window.location.href = 'login.html';
} 