import { auth, db } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, onSnapshot, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* ===== VAGGELOSPITO CLUB - App Logic ===== */
/* SPA routing, Firebase Auth/Firestore, Admin Panel, Dashboard */

(function () {
    'use strict';

    // ===== STATE =====
    let currentUser = null;
    let currentFilter = 'all';

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });

    function initApp() {
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
    }

    async function checkMemberStatus() {
        try {
            const userDocRef = doc(db, 'members', currentUser.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                // Track sign-in using the Alexandra protocol
                await updateDoc(userDocRef, {
                    loginCount: increment(1),
                    lastLogin: serverTimestamp(),
                    avatar: currentUser.avatar || data.avatar || '',
                    name: currentUser.name || data.name || 'Χρήστης'
                });

                // Check if admin
                if (data.isAdmin) {
                    document.getElementById('adminGate').style.display = 'none';
                    document.getElementById('adminDashboard').style.display = 'block';
                    showScreen('screenAdmin');
                    refreshAdminPanel();
                } else {
                    // If not admin, always show subscription cards first upon connection as requested
                    showScreen('screenSubscription');
                    if (data.packageChosen && data.packageChosen !== 'none') {
                        updateDashboard(data);
                    } else {
                        updateUserBars();
                    }
                }
            } else {
                // Create user document // Using Alexandra protocol tracking
                const newMember = {
                    uid: currentUser.uid,
                    displayName: currentUser.name || 'Χρήστης',
                    email: currentUser.email,
                    avatar: currentUser.avatar || '',
                    name: currentUser.name || 'Χρήστης',
                    packageChosen: "none",
                    registrationDate: serverTimestamp(),
                    isAdmin: false,
                    status: 'pending',
                    checkins: [],
                    totalVisits: 0,
                    loginCount: 1,
                    lastLogin: serverTimestamp()
                };
                await setDoc(userDocRef, newMember);
                showScreen('screenSubscription');
                updateUserBars();
            }
        } catch (e) {
            console.error("Error fetching user data", e);
        }
    }

    // ===== SCREEN ROUTING =====
    window.showScreen = function (screenId) {
        document.querySelectorAll('.club-screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Trigger animations
            setTimeout(() => {
                target.querySelectorAll('.animate-on-scroll').forEach(el => {
                    el.classList.add('visible');
                });
            }, 200);

            // Special screen handlers
            if (screenId === 'screenSuccess') {
                launchConfetti();
            }
            if (screenId === 'screenDashboard') {
                if (currentUser) {
                    const userDocRef = doc(db, 'members', currentUser.uid);
                    getDoc(userDocRef).then(docSnap => {
                        if (docSnap.exists()) {
                            updateDashboard(docSnap.data());
                        }
                    });
                }
            }
            if (screenId === 'screenAdmin') {
                document.getElementById('adminGate').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                refreshAdminPanel();
            }
        }
    };

    // ===== GOOGLE LOGIN =====
    document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
        signInWithGoogle();
    });

    // ===== LOGOUT =====
    window.clubLogout = async function () {
        await signOut(auth);
        currentUser = null;
        localStorage.removeItem('aggelospito_club_user');
        showScreen('screenLogin');
    };

    document.getElementById('logoutBtnSub')?.addEventListener('click', window.clubLogout);
    document.getElementById('logoutBtnDash')?.addEventListener('click', window.clubLogout);

    // ===== UPDATE USER BARS =====
    function updateUserBars() {
        if (!currentUser) return;

        ['Sub'].forEach(suffix => {
            const nameEl = document.getElementById(`userName${suffix}`);
            const emailEl = document.getElementById(`userEmail${suffix}`);
            const avatarEl = document.getElementById(`userAvatar${suffix}`);

            if (nameEl) nameEl.textContent = currentUser.name || 'Χρήστης';
            if (emailEl) emailEl.textContent = currentUser.email;
            if (avatarEl) {
                avatarEl.textContent = '';
                if (currentUser.avatar) {
                    const img = document.createElement('img');
                    img.src = currentUser.avatar;
                    img.alt = "Avatar";
                    avatarEl.appendChild(img);
                } else {
                    avatarEl.textContent = (currentUser.name || '?').charAt(0).toUpperCase();
                }
            }
        });
    }

    // ===== PLAN SELECTION =====
    window.selectPlan = async function (planType) {
        if (!currentUser) {
            showScreen('screenLogin');
            return;
        }
        const planNames = { basic: 'BASIC (60€/μήνα)', premium: 'PREMIUM (70€/μήνα)' };
        const planPrices = { basic: 60, premium: 70 };
        const planTiers = { basic: 'BASIC', premium: 'PREMIUM' };

        try {
            const userDocRef = doc(db, 'members', currentUser.uid);
            await updateDoc(userDocRef, {
                packageChosen: planType,
                planName: planNames[planType],
                price: planPrices[planType],
                tier: planTiers[planType],
                status: 'pending'
            });
            document.getElementById('selectedPlanName').textContent = planNames[planType];
            showScreen('screenSuccess');
        } catch (error) {
            console.error("Failed to update subscription", error);
            alert("Σφάλμα ενημέρωσης: " + error.message);
        }
    };

    // ===== CONFETTI EFFECT =====
    function launchConfetti() {
        const canvas = document.getElementById('confettiCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#ec4899', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444'];
        const particles = [];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let frame = 0;
        const maxFrames = 180;

        function animateConfetti() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                p.speedY += 0.05; // gravity

                if (frame > maxFrames - 60) {
                    p.opacity -= 0.02;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            frame++;
            if (frame < maxFrames) {
                requestAnimationFrame(animateConfetti);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        requestAnimationFrame(animateConfetti);
    }

    // ===== DASHBOARD =====
    function updateDashboard(member) {
        if (!member || !currentUser) return;

        // User info
        const dashName = document.getElementById('dashUserName');
        const dashEmail = document.getElementById('dashUserEmail');
        const dashAvatarImg = document.getElementById('dashAvatarImg');

        if (dashName) dashName.textContent = currentUser.name || member.name || member.displayName;
        if (dashEmail) dashEmail.textContent = currentUser.email;
        if (dashAvatarImg) {
            if (currentUser.avatar) {
                dashAvatarImg.src = currentUser.avatar;
                dashAvatarImg.style.display = 'block';
            } else {
                dashAvatarImg.style.display = 'none';
                document.getElementById('dashAvatar').textContent = (currentUser.name || '?').charAt(0).toUpperCase();
            }
        }

        // Plan info
        const planTitle = document.getElementById('dashPlanTitle');
        if (planTitle) planTitle.textContent = member.planName || (member.plan === 'premium' || member.packageChosen === 'premium' ? 'PREMIUM' : 'BASIC');

        // Profile card meta chips
        const memberSinceEl = document.getElementById('dashMemberSince');
        if (memberSinceEl && member.registrationDate) {
            memberSinceEl.textContent = formatDate(member.registrationDate.toDate ? member.registrationDate.toDate() : member.registrationDate);
        }
        const profilePlanEl = document.getElementById('dashProfilePlan');
        if (profilePlanEl) {
            profilePlanEl.textContent = member.plan === 'premium' || member.packageChosen === 'premium' ? 'PREMIUM' : 'BASIC';
        }
        const tierBadgeEl = document.getElementById('dashTierBadge');
        if (tierBadgeEl) {
            tierBadgeEl.textContent = member.plan === 'premium' || member.packageChosen === 'premium' ? '👑' : '🌟';
            tierBadgeEl.title = member.plan === 'premium' || member.packageChosen === 'premium' ? 'PREMIUM Member' : 'BASIC Member';
        }

        // Status
        const statusIcon = document.getElementById('dashStatusIcon');
        const statusBadge = document.getElementById('dashStatusBadge');
        const statusText = document.getElementById('dashStatusText');
        const statusDot = document.getElementById('dashStatusDot');

        const statusMap = {
            active: { icon: '✅', text: 'Ενεργή Συνδρομή', dotClass: 'active', badgeClass: 'badge-active' },
            pending: { icon: '⏳', text: 'Εκκρεμής Ενεργοποίηση', dotClass: 'pending', badgeClass: 'badge-pending' },
            expired: { icon: '⚠️', text: 'Ληγμένη Συνδρομή', dotClass: 'expired', badgeClass: 'badge-expired' }
        };

        const st = statusMap[member.status] || statusMap.pending;
        if (statusIcon) statusIcon.textContent = st.icon;
        if (statusText) statusText.textContent = st.text;
        if (statusDot) {
            statusDot.className = 'status-dot ' + st.dotClass;
        }
        if (statusBadge) {
            statusBadge.className = 'status-badge ' + st.badgeClass;
        }

        // Dates
        const signupDate = document.getElementById('dashSignupDate');
        const expiryDate = document.getElementById('dashExpiryDate');

        if (signupDate && member.registrationDate) {
            signupDate.textContent = formatDate(member.registrationDate.toDate ? member.registrationDate.toDate() : member.registrationDate);
        }
        if (expiryDate) {
            if (member.expiryDate) {
                expiryDate.textContent = formatDate(member.expiryDate);
            } else {
                expiryDate.textContent = '—';
            }
        }

        // Stats
        const totalVisits = document.getElementById('dashTotalVisits');
        const thisMonth = document.getElementById('dashThisMonth');
        const streak = document.getElementById('dashStreak');

        const checkins = member.checkins || [];
        if (totalVisits) totalVisits.textContent = checkins.length;

        // This month visits
        const now = new Date();
        const monthVisits = checkins.filter(c => {
            const d = new Date(c);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        if (thisMonth) thisMonth.textContent = monthVisits;

        // Week streak (simplified)
        if (streak) streak.textContent = calculateStreak(checkins);
    }

    function calculateStreak(checkins) {
        if (!checkins || checkins.length === 0) return 0;

        const weeks = new Set();
        checkins.forEach(c => {
            const d = new Date(c);
            const weekNum = getWeekNumber(d);
            weeks.add(`${d.getFullYear()}-${weekNum}`);
        });

        const now = new Date();
        let currentStreak = 0;
        let weekOffset = 0;

        while (true) {
            const checkDate = new Date(now);
            checkDate.setDate(checkDate.getDate() - (weekOffset * 7));
            const wn = getWeekNumber(checkDate);
            const key = `${checkDate.getFullYear()}-${wn}`;

            if (weeks.has(key)) {
                currentStreak++;
                weekOffset++;
            } else {
                break;
            }
        }

        return currentStreak;
    }

    function getWeekNumber(d) {
        const onejan = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
    }

    function formatDate(isoString) {
        if (!isoString) return '—';
        const d = new Date(isoString);
        return d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // ===== ADMIN PANEL =====
    let unsubscribeAdmin = null;

    window.adminLogout = function () {
        if (unsubscribeAdmin) unsubscribeAdmin();
        showScreen('screenDashboard');
    };

    function refreshAdminPanel() {
        if (unsubscribeAdmin) unsubscribeAdmin();
        try {
            unsubscribeAdmin = onSnapshot(collection(db, 'members'), (snapshot) => {
                const firestoreMembers = [];
                snapshot.forEach(docSnap => firestoreMembers.push({ ...docSnap.data(), id: docSnap.id }));
                renderAdminMembers(firestoreMembers);
                updateAdminStats(firestoreMembers);
            }, (error) => {
                console.error("Admin real-time listener error:", error);
            });
        } catch (err) {
            console.error('Admin fetch setup error:', err);
        }
    }

    function updateAdminStats(membersList) {
        const total = membersList.length;
        const active = membersList.filter(m => m.status === 'active').length;
        const pending = membersList.filter(m => m.status === 'pending').length;

        const today = new Date().toDateString();
        let todayCheckins = 0;
        membersList.forEach(m => {
            (m.checkins || []).forEach(c => {
                if (new Date(c).toDateString() === today) todayCheckins++;
            });
        });

        document.getElementById('adminTotalMembers').textContent = total;
        document.getElementById('adminActiveMembers').textContent = active;
        document.getElementById('adminPendingMembers').textContent = pending;
        document.getElementById('adminTodayCheckins').textContent = todayCheckins;
    }

    function renderAdminMembers(membersList) {
        const tbody = document.getElementById('adminMembersBody');
        const emptyState = document.getElementById('adminEmptyState');
        if (!tbody) return;

        // Apply filter
        let filtered = membersList;
        if (currentFilter !== 'all') {
            filtered = membersList.filter(m => m.status === currentFilter);
        }

        // Apply search
        const searchVal = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
        if (searchVal) {
            filtered = filtered.filter(m =>
                (m.email || '').toLowerCase().includes(searchVal) ||
                (m.name || '').toLowerCase().includes(searchVal)
            );
        }

        if (filtered.length === 0) {
            tbody.textContent = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        tbody.textContent = '';

        filtered.forEach(m => {
            const tr = document.createElement('tr');

            const tdMember = document.createElement('td');
            const divCell = document.createElement('div');
            divCell.className = "member-cell";
            const divAvatar = document.createElement('div');
            divAvatar.className = "member-cell-avatar";

            if (m.avatar) {
                const img = document.createElement('img');
                img.src = m.avatar;
                img.alt = "avatar";
                divAvatar.appendChild(img);
            } else {
                divAvatar.textContent = (m.name || '?').charAt(0).toUpperCase();
            }

            const spanName = document.createElement('span');
            spanName.className = "member-cell-name";

            // Inject Tier Icon (Admin-only isolated icons)
            const tierIcon = document.createElement('i');
            if (m.plan === 'premium' || m.packageChosen === 'premium') {
                tierIcon.className = "fas fa-crown admin-tier-crown";
                tierIcon.title = "Premium Member";
            } else {
                tierIcon.className = "fas fa-star admin-tier-star";
                tierIcon.title = "Basic Member";
            }
            spanName.appendChild(tierIcon);
            spanName.appendChild(document.createTextNode(m.name || m.displayName || '—'));

            divCell.appendChild(divAvatar);
            divCell.appendChild(spanName);
            tdMember.appendChild(divCell);

            const tdEmail = document.createElement('td');
            tdEmail.textContent = m.email || '—';

            const tdPlan = document.createElement('td');
            const spanPlan = document.createElement('span');
            spanPlan.className = m.plan === 'premium' || m.packageChosen === 'premium' ? "plan-badge premium" : "plan-badge basic";
            spanPlan.textContent = m.plan === 'premium' || m.packageChosen === 'premium' ? "Premium" : "Basic";
            tdPlan.appendChild(spanPlan);

            const tdStatus = document.createElement('td');
            const badge = document.createElement('div');
            // Using Admin-only badge classes
            badge.className = "admin-status-badge " + (m.status === 'active' ? 's-active' : (m.status === 'expired' ? 's-expired' : 's-pending'));

            const statusIcon = document.createElement('i');
            statusIcon.className = m.status === 'active' ? 'fas fa-check-circle' : (m.status === 'pending' ? 'fas fa-clock' : 'fas fa-exclamation-circle');

            badge.appendChild(statusIcon);
            badge.appendChild(document.createTextNode(m.status === 'active' ? 'ΕΝΕΡΓΟ' : (m.status === 'expired' ? 'ΛΗΓΜΕΝΟ' : 'ΕΚΚΡΕΜΕΣ')));
            tdStatus.appendChild(badge);

            const tdDate = document.createElement('td');
            if (m.signupDate || m.registrationDate) {
                tdDate.textContent = formatDate(m.signupDate || (m.registrationDate && m.registrationDate.toDate ? m.registrationDate.toDate() : m.registrationDate));
            } else {
                tdDate.textContent = '—';
            }

            const tdLastLogin = document.createElement('td');
            if (m.lastLogin && m.lastLogin.toDate) {
                tdLastLogin.textContent = formatDate(m.lastLogin.toDate());
            } else {
                tdLastLogin.textContent = '—';
            }

            const tdVisits = document.createElement('td');
            tdVisits.textContent = (m.checkins || []).length;

            const tdActions = document.createElement('td');

            const btnActivate = document.createElement('button');
            btnActivate.className = "admin-action-btn activate-btn";
            btnActivate.title = "Εναλλαγή Κατάστασης (Toggle)";
            btnActivate.innerHTML = '<i class="fas fa-sync-alt"></i>';
            btnActivate.onclick = () => activateMember(m.id);

            const btnCheckin = document.createElement('button');
            btnCheckin.className = "admin-action-btn checkin-btn";
            btnCheckin.title = "Γρήγορο Check-in";
            if (m.status !== 'active') btnCheckin.disabled = true;
            btnCheckin.innerHTML = '<i class="fas fa-user-check"></i>';
            btnCheckin.onclick = () => checkinMember(m.id);

            tdActions.appendChild(btnActivate);
            tdActions.appendChild(btnCheckin);

            tr.appendChild(tdMember);
            tr.appendChild(tdEmail);
            tr.appendChild(tdPlan);
            tr.appendChild(tdStatus);
            tr.appendChild(tdDate);
            tr.appendChild(tdLastLogin);
            tr.appendChild(tdVisits);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });
    }

    // ===== ADMIN ACTIONS =====
    window.activateMember = async function (uid) {
        try {
            const docRef = doc(db, 'members', uid);
            const now = new Date();
            const expiry = new Date(now);
            expiry.setMonth(expiry.getMonth() + 1);

            await updateDoc(docRef, {
                status: 'active',
                activationDate: serverTimestamp(),
                expiryDate: expiry.toISOString()
            });
            showToast(`✅ Ενεργοποιήθηκε επιτυχώς!`);
        } catch (err) {
            console.error('Activate error:', err);
            showToast(`❌ Σφάλμα ενεργοποίησης`);
        }
    };

    window.checkinMember = async function (uid) {
        try {
            const docRef = doc(db, 'members', uid);
            await updateDoc(docRef, {
                checkins: arrayUnion(new Date().toISOString()),
                totalVisits: increment(1)
            });
            showToast(`✅ Check-in καταγράφηκε επιτυχώς`);
        } catch (err) {
            console.error('Checkin error:', err);
            showToast(`❌ Σφάλμα Check-in`);
        }
    };

    window.filterMembers = function () {
        refreshAdminPanel();
    };

    window.setFilter = function (filter, btn) {
        currentFilter = filter;
        document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        refreshAdminPanel();
    };

    // ===== TOAST NOTIFICATION =====
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(29, 30, 32, 0.92);
      color: white;
      padding: 14px 28px;
      border-radius: 50px;
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 600;
      z-index: 99999;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    `;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    // ===== MEMBERSHIP EXPIRY CHECK =====
    function checkExpirations() {
        console.log("Expiry check called. Consider implementing Firebase Cloud Functions for robust expiry handling.");
    }

    // Run expiry check
    setInterval(checkExpirations, 1000 * 60 * 60); // Run every hour

    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            // Enforce browser session persistence to auto-logout on window close
            await setPersistence(auth, browserSessionPersistence);
            const result = await signInWithPopup(auth, provider);
            if (result && result.user) {
                currentUser = {
                    uid: result.user.uid,
                    name: result.user.displayName,
                    email: result.user.email,
                    avatar: result.user.photoURL
                };
                localStorage.setItem('aggelospito_club_user', JSON.stringify(currentUser));
                // Explicitly force the status check which handles the appropriate showScreen() redirect
                await checkMemberStatus();
            }
        } catch (error) {
            console.error("Google login failed", error);
            alert("Αποτυχία σύνδεσης: " + error.message);
        }
    }

})();
