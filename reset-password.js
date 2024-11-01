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
const resetForm = document.querySelector('.reset-form');

// Reset Password
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = resetForm.querySelector('input[name="email"]').value;
    
    try {
        await auth.sendPasswordResetEmail(email);
        alert('Password reset link sent! Please check your email.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error sending reset email:', error);
        let errorMessage = 'Error sending reset email. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
        }
        
        alert(errorMessage);
    }
}); 