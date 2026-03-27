import re

with open('club-app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix renderAdminMembers buttons
js = js.replace("onclick=\"activateMember('${m.email}')\"", "onclick=\"window.activateMember('${m.id}')\"")
js = js.replace("onclick=\"checkinMember('${m.email}')\"", "onclick=\"window.checkinMember('${m.id}')\"")

# Rewrite activateMember
activate_member = """window.activateMember = async function (id) {
    try {
        const now = new Date();
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + 13); // 12 months + 1 free month
        
        const memberRef = doc(db, 'members', id);
        await updateDoc(memberRef, {
            status: 'active',
            activationDate: now.toISOString(),
            expiryDate: expiry.toISOString()
        });
        
        await refreshAdminPanel();
    } catch (err) {
        console.error('Activate error:', err);
        alert('Σφάλμα ενεργοποίησης: ' + err.message);
    }
};"""
js = re.sub(r'window\.activateMember = function\s*\(email\)\s*\{.*?(?=\s+window\.checkinMember = )', activate_member, js, flags=re.DOTALL)

# Rewrite checkinMember
checkin_member = """window.checkinMember = async function (id) {
    try {
        const now = new Date().toISOString();
        const memberRef = doc(db, 'members', id);
        const docSnap = await getDoc(memberRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const checkins = data.checkins || [];
            checkins.push(now);
            
            await updateDoc(memberRef, {
                checkins: checkins,
                totalVisits: checkins.length
            });
            
            await refreshAdminPanel();
            showToast(`✅ Check-in recorded`);
        }
    } catch (err) {
        console.error('Checkin error:', err);
        alert('Σφάλμα Check-in: ' + err.message);
    }
};"""
js = re.sub(r'window\.checkinMember = function\s*\(email\)\s*\{.*?(?=\s+window\.filterMembers = )', checkin_member, js, flags=re.DOTALL)

with open('club-app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Admin actions fixed and hooked to Firestore module.")
