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
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const actionCode = urlParams.get('oobCode');

// DOM Elements
const form = document.querySelector('.new-password-form');
const passwordInput = form.querySelector('input[name="password"]');
const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');

// Handle Password Reset
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (passwordInput.value !== confirmPasswordInput.value) {
        alert('Passwords do not match');
        return;
    }

    try {
        // Verify the password reset code is valid
        await auth.verifyPasswordResetCode(actionCode);
        
        // Confirm the password reset
        await auth.confirmPasswordReset(actionCode, passwordInput.value);
        
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
                errorMessage = 'Password should be at least 6 characters.';
                break;
        }
        
        alert(errorMessage);
    }
});

// Verify action code when page loads
auth.verifyPasswordResetCode(actionCode).catch(error => {
    console.error('Error verifying reset code:', error);
    alert('Invalid or expired password reset link. Please request a new one.');
    window.location.href = 'login.html';
}); 