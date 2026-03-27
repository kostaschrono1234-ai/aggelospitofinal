import re

with open('club-app.js', 'r') as f:
    code = f.read()

# Remove firebase config block
code = re.sub(r'firebase:\s*\{[^}]+\},', '', code, flags=re.MULTILINE)
# Remove db and auth vars
code = re.sub(r'let db = null;\s*let auth = null;', '', code)
# Strip out firebase blocks in initApp
code = re.sub(r'if \(!CONFIG\.useDemoMode && typeof firebase !== \'undefined\'\) \{.*?\n\s*\}', '', code, flags=re.DOTALL)
# Strip out user session init
code = re.sub(r'if \(!CONFIG\.useDemoMode && auth\) \{.*?} else \{\s*initDemoSession\(\);\s*\}', 'initDemoSession();', code, flags=re.DOTALL)
# Strip out setupFirebaseAuthListener entirely
code = re.sub(r'function setupFirebaseAuthListener\(\) \{.*?\n\s*\}', '', code, flags=re.DOTALL)

# Simplify checkingmemberstatus
code = re.sub(r'async function checkMemberStatus\(\) \{.*?\} else \{.*?\s*\}\s*\}', 
'''async function checkMemberStatus() {
        const member = findMemberByEmail(currentUser.email);
        if (member) {
            showScreen('screenDashboard');
            updateDashboard(member);
        } else {
            showScreen('screenSubscription');
            updateUserBars();
        }
    }''', code, flags=re.DOTALL)

# Simplify google signin
code = re.sub(r'document\.getElementById\(\'googleLoginBtn\'\)\?\.addEventListener\(\'click\', \(\) => \{.*?\}\);', 
'''document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
        demoLogin();
    });''', code, flags=re.DOTALL)

code = re.sub(r'function firebaseGoogleLogin\(\) \{.*?\}\s*', '', code, flags=re.DOTALL)

# Simplify logout
code = re.sub(r'if \(auth\) auth\.signOut\(\);', '', code)

# Clean up Firestore saves
code = re.sub(r'if \(CONFIG.useDemoMode\) \{(.*?)\} else \{.*?\}', r'\1', code, flags=re.DOTALL)

with open('club-app.js', 'w') as f:
    f.write(code)

with open('club.html', 'r') as f:
    html = f.read()
html = re.sub(r'<!-- Firebase SDK -->.*?firebase-firestore-compat\.js"></script>', '', html, flags=re.DOTALL)
with open('club.html', 'w') as f:
    f.write(html)
