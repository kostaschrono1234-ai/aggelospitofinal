import re
import os

with open('club.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make club-app.js a module in the HTML
html = html.replace('<script src="club-app.js"></script>', '<script type="module" src="club-app.js"></script>')
with open('club.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('club-app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Strip the IIFE completely
js = re.sub(r'^\(function\s*\(\)\s*\{[ \t]*\n\s*\'use strict\';', '', js)
js = re.sub(r'\}\)\(\);\s*$', '', js)

# Inject imports at the top
imports = """import { auth, db } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

"""

js = imports + js

# Replace CONFIG and useDemoMode
js = re.sub(r'const CONFIG = \{.*?useDemoMode:.*?(\r?\n)*\s*\};?', 'const CONFIG = {\n    adminPassword: "aggelospito2025"\n};\n', js, flags=re.DOTALL)

# Refactor the init processes
js = js.replace('function initDemoSession()', 'function _legacySession()')
js = js.replace('function demoLogin()', 'async function demoLogin()')

init_app_new = """function initApp() {
    // 1) Setup auth listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Logged in
            currentUser = {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                avatar: user.photoURL
            };
            localStorage.setItem('aggelospito_club_user', JSON.stringify(currentUser));
            await checkMemberStatus();
        } else {
            // Logged out
            currentUser = null;
            localStorage.removeItem('aggelospito_club_user');
            showScreen('screenLogin');
        }
    });
}"""
js = re.sub(r'function initApp\(\)\s*\{.*?(?=\s+// ===== FIREBASE AUTH =====|\s+// ===== SCREEN ROUTING =====)', init_app_new, js, flags=re.DOTALL)

check_member = """async function checkMemberStatus() {
    try {
        const userDocRef = doc(db, 'members', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Check if admin
            if (data.isAdmin) {
                document.getElementById('adminGate').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                showScreen('screenAdmin');
                refreshAdminPanel();
            } else if (data.packageChosen && data.packageChosen !== 'none') {
                showScreen('screenDashboard');
                updateDashboard(data);
            } else {
                showScreen('screenSubscription');
                updateUserBars();
            }
        } else {
            // Create user document
            const newMember = {
                uid: currentUser.uid,
                displayName: currentUser.name,
                email: currentUser.email,
                avatar: currentUser.avatar || '',
                packageChosen: "none",
                registrationDate: serverTimestamp(),
                isAdmin: false,
                status: 'pending',
                checkins: [],
                totalVisits: 0
            };
            await setDoc(userDocRef, newMember);
            showScreen('screenSubscription');
            updateUserBars();
        }
    } catch (e) {
        console.error("Error fetching user data", e);
    }
}"""
# Find and replace the old checkMemberStatus
js = re.sub(r'async function checkMemberStatus\(\)\s*\{.*?(?=\s+// ===== SCREEN ROUTING =====)', check_member, js, flags=re.DOTALL)

# Replace Google Login binding:
js = js.replace('demoLogin(); // fallback just in case', 'signInWithGoogle();')
js = js.replace('demoLogin();', 'signInWithGoogle();')

signin_code = """
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google login failed", error);
        alert("Αποτυχία σύνδεσης: " + error.message);
    }
}
"""
js = js + signin_code

# Replace selectPlan / updateSubscription
select_plan = """
window.selectPlan = async function(planType) {
    if (!currentUser) {
        showScreen('screenLogin');
        return;
    }
    const planNames = { basic: 'Basic Family (15€/μήνα)', premium: 'Premium Family (25€/μήνα)' };

    try {
        const userDocRef = doc(db, 'members', currentUser.uid);
        await updateDoc(userDocRef, {
            packageChosen: planType,
            planName: planNames[planType],
            status: 'pending'
        });
        document.getElementById('selectedPlanName').textContent = planNames[planType];
        showScreen('screenSuccess');
    } catch (error) {
        console.error("Failed to update subscription", error);
        alert("Σφάλμα ενημέρωσης: " + error.message);
    }
};
"""
js = re.sub(r'window\.selectPlan = function\s*\(planType\)\s*\{.*?(?=\s+// ===== CONFETTI EFFECT =====)', select_plan, js, flags=re.DOTALL)

# Replace logout definition
logout_code = """
window.clubLogout = async function() {
    await signOut(auth);
    currentUser = null;
    localStorage.removeItem('aggelospito_club_user');
    showScreen('screenLogin');
};
"""
js = re.sub(r'function logout\(\)\s*\{.*?\}', logout_code, js, flags=re.DOTALL)

# Update the HTML IDs in js
js = js.replace("document.getElementById('logoutBtnSub')?.addEventListener('click', logout);", "document.getElementById('logoutBtnSub')?.addEventListener('click', window.clubLogout);")
js = js.replace("document.getElementById('logoutBtnDash')?.addEventListener('click', logout);", "document.getElementById('logoutBtnDash')?.addEventListener('click', window.clubLogout);")

with open('club-app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Firebase successfully integrated.")
