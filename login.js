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
        await auth.signInWithRedirect(provider);
    } catch (error) {
        console.error('Error with Google auth:', error);
        alert('Error signing in with Google. Please try again.');
    }
});

// Handle redirect result
auth.getRedirectResult().then((result) => {
    if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = 'dashboard.html';
    }
}).catch((error) => {
    console.error('Redirect error:', error);
});

// Email/Password Sign In
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;
    
    try {
        const result = await auth.signInWithEmailAndPassword(email, password);
        localStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error signing in:', error);
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
        
        alert(errorMessage);
    }
});

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    }
}); 