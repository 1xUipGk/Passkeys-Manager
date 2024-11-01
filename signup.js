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
        const result = await auth.signInWithPopup(provider);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error signing up with Google:', error);
        alert('Error signing up with Google. Please try again.');
    }
});

// Email/Password Sign Up
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = signupForm.querySelector('input[name="email"]').value;
    const password = signupForm.querySelector('input[name="password"]').value;

    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error signing up:', error);
        let errorMessage = 'Error creating account. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters.';
                break;
        }
        
        alert(errorMessage);
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