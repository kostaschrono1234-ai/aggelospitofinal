/* ===== VAGGELOSPITO CLUB - App Logic ===== */
/* SPA routing, Firebase Auth/Firestore, Admin Panel, Dashboard */

(function () {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        // Firebase config — replace with your actual Firebase project credentials
        firebase: {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_PROJECT.firebaseapp.com",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_PROJECT.appspot.com",
            messagingSenderId: "000000000000",
            appId: "YOUR_APP_ID"
        },
        adminPassword: 'aggelospito2025', // Simple admin password
        useDemoMode: true // Set to false when Firebase is configured
    };

    // ===== STATE =====
    let currentUser = null;
    let members = []; // In-memory member list for demo mode
    let currentFilter = 'all';
    let db = null;
    let auth = null;

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
    });

    function initApp() {
        // Initialize Firebase or Demo Mode FIRST so data is available
        if (!CONFIG.useDemoMode && typeof firebase !== 'undefined') {
            try {
                firebase.initializeApp(CONFIG.firebase);
                auth = firebase.auth();
                db = firebase.firestore();
            } catch (e) {
                console.warn('Firebase init failed, falling back to demo mode', e);
                CONFIG.useDemoMode = true;
            }
        }

        // Always load demo data from localStorage (even for admin)
        if (CONFIG.useDemoMode) {
            const stored = localStorage.getItem('aggelospito_club_members');
            if (stored) {
                members = JSON.parse(stored);
            }
        }

        // Check for admin mode via URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === 'true') {
            showScreen('screenAdmin');
            return;
        }

        // Initialize user session
        if (!CONFIG.useDemoMode && auth) {
            setupFirebaseAuthListener();
        } else {
            initDemoSession();
        }
    }

    // ===== DEMO SESSION (user session only, data already loaded in initApp) =====
    function initDemoSession() {
        // Check if user is already logged in
        const storedUser = localStorage.getItem('aggelospito_club_user');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            const member = findMemberByEmail(currentUser.email);
            if (member) {
                showScreen('screenDashboard');
                updateDashboard(member);
            } else {
                showScreen('screenSubscription');
                updateUserBars();
            }
        } else {
            showScreen('screenLogin');
        }
    }

    function saveMembers() {
        localStorage.setItem('aggelospito_club_members', JSON.stringify(members));
    }

    function findMemberByEmail(email) {
        return members.find(m => m.email === email);
    }

    // ===== FIREBASE AUTH =====
    function setupFirebaseAuthListener() {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = {
                    name: user.displayName || 'Χρήστης',
                    email: user.email,
                    avatar: user.photoURL || ''
                };
                localStorage.setItem('aggelospito_club_user', JSON.stringify(currentUser));
                checkMemberStatus();
            } else {
                showScreen('screenLogin');
            }
        });
    }

    async function checkMemberStatus() {
        if (CONFIG.useDemoMode) {
            const member = findMemberByEmail(currentUser.email);
            if (member) {
                showScreen('screenDashboard');
                updateDashboard(member);
            } else {
                showScreen('screenSubscription');
                updateUserBars();
            }
        } else {
            // Firestore lookup
            try {
                const doc = await db.collection('members').doc(currentUser.email).get();
                if (doc.exists) {
                    showScreen('screenDashboard');
                    updateDashboard(doc.data());
                } else {
                    showScreen('screenSubscription');
                    updateUserBars();
                }
            } catch (e) {
                console.error('Firestore error', e);
                showScreen('screenSubscription');
                updateUserBars();
            }
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
                    const member = findMemberByEmail(currentUser.email);
                    if (member) updateDashboard(member);
                }
            }
            if (screenId === 'screenAdmin') {
                const isAuthenticated = sessionStorage.getItem('aggelospito_admin_auth');
                if (isAuthenticated) {
                    document.getElementById('adminGate').style.display = 'none';
                    document.getElementById('adminDashboard').style.display = 'block';
                    refreshAdminPanel();
                }
            }
        }
    };

    // ===== GOOGLE LOGIN =====
    document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
        if (CONFIG.useDemoMode) {
            demoLogin();
        } else {
            firebaseGoogleLogin();
        }
    });

    function demoLogin() {
        // Simulate Google login with a prompt
        const name = prompt('🔐 Demo Mode\n\nΕισάγετε το ονοματεπώνυμό σας:', 'Μαρία Παπαδοπούλου');
        if (!name) return;

        const email = prompt('📧 Εισάγετε το email σας:', 'maria@example.com');
        if (!email) return;

        currentUser = {
            name: name,
            email: email,
            avatar: ''
        };

        localStorage.setItem('aggelospito_club_user', JSON.stringify(currentUser));

        // Check if already a member
        const member = findMemberByEmail(email);
        if (member) {
            showScreen('screenDashboard');
            updateDashboard(member);
        } else {
            showScreen('screenSubscription');
            updateUserBars();
        }
    }

    function firebaseGoogleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
            console.error('Google sign-in error:', err);
            alert('Αποτυχία σύνδεσης. Δοκιμάστε ξανά.');
        });
    }

    // ===== LOGOUT =====
    document.getElementById('logoutBtnSub')?.addEventListener('click', logout);
    document.getElementById('logoutBtnDash')?.addEventListener('click', logout);

    function logout() {
        currentUser = null;
        localStorage.removeItem('aggelospito_club_user');
        if (auth) auth.signOut();
        showScreen('screenLogin');
    }

    // ===== UPDATE USER BARS =====
    function updateUserBars() {
        if (!currentUser) return;

        ['Sub'].forEach(suffix => {
            const nameEl = document.getElementById(`userName${suffix}`);
            const emailEl = document.getElementById(`userEmail${suffix}`);
            const avatarEl = document.getElementById(`userAvatar${suffix}`);

            if (nameEl) nameEl.textContent = currentUser.name;
            if (emailEl) emailEl.textContent = currentUser.email;
            if (avatarEl) {
                if (currentUser.avatar) {
                    avatarEl.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar">`;
                } else {
                    avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
                }
            }
        });
    }

    // ===== PLAN SELECTION =====
    window.selectPlan = function (planType) {
        if (!currentUser) {
            showScreen('screenLogin');
            return;
        }

        const planNames = {
            basic: 'Basic Family (15€/μήνα)',
            premium: 'Premium Family (25€/μήνα)'
        };

        const now = new Date();
        const newMember = {
            name: currentUser.name,
            email: currentUser.email,
            avatar: currentUser.avatar || '',
            plan: planType,
            planName: planNames[planType],
            status: 'pending', // pending, active, expired
            signupDate: now.toISOString(),
            activationDate: null,
            expiryDate: null,
            checkins: [],
            totalVisits: 0
        };

        if (CONFIG.useDemoMode) {
            // Remove existing entry if any
            members = members.filter(m => m.email !== currentUser.email);
            members.push(newMember);
            saveMembers();
        } else {
            // Save to Firestore
            db.collection('members').doc(currentUser.email).set(newMember)
                .catch(err => console.error('Firestore save error:', err));
        }

        // Update success screen
        document.getElementById('selectedPlanName').textContent = planNames[planType];

        // Show success screen
        showScreen('screenSuccess');
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

        if (dashName) dashName.textContent = currentUser.name;
        if (dashEmail) dashEmail.textContent = currentUser.email;
        if (dashAvatarImg) {
            if (currentUser.avatar) {
                dashAvatarImg.src = currentUser.avatar;
                dashAvatarImg.style.display = 'block';
            } else {
                dashAvatarImg.style.display = 'none';
                document.getElementById('dashAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
            }
        }

        // Plan info
        const planTitle = document.getElementById('dashPlanTitle');
        if (planTitle) planTitle.textContent = member.planName || (member.plan === 'premium' ? 'Premium Family' : 'Basic Family');

        // Profile card meta chips
        const memberSinceEl = document.getElementById('dashMemberSince');
        if (memberSinceEl && member.signupDate) {
            memberSinceEl.textContent = formatDate(member.signupDate);
        }
        const profilePlanEl = document.getElementById('dashProfilePlan');
        if (profilePlanEl) {
            profilePlanEl.textContent = member.plan === 'premium' ? 'Premium Family' : 'Basic Family';
        }
        const tierBadgeEl = document.getElementById('dashTierBadge');
        if (tierBadgeEl) {
            tierBadgeEl.textContent = member.plan === 'premium' ? '👑' : '🌟';
            tierBadgeEl.title = member.plan === 'premium' ? 'Premium Member' : 'Basic Member';
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

        if (signupDate && member.signupDate) {
            signupDate.textContent = formatDate(member.signupDate);
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

        // Count consecutive weeks from now
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
    window.adminLogin = function () {
        const input = document.getElementById('adminPasswordInput');
        const error = document.getElementById('adminError');

        if (input.value === CONFIG.adminPassword) {
            sessionStorage.setItem('aggelospito_admin_auth', 'true');
            document.getElementById('adminGate').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            error.style.display = 'none';
            refreshAdminPanel();

            // Trigger animations
            setTimeout(() => {
                document.querySelectorAll('#adminDashboard .animate-on-scroll').forEach(el => {
                    el.classList.add('visible');
                });
            }, 100);
        } else {
            error.style.display = 'block';
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 400);
        }
    };

    // Enter key for admin password
    document.getElementById('adminPasswordInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.adminLogin();
    });

    window.adminLogout = function () {
        sessionStorage.removeItem('aggelospito_admin_auth');
        document.getElementById('adminGate').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('adminPasswordInput').value = '';
    };

    function refreshAdminPanel() {
        if (CONFIG.useDemoMode) {
            renderAdminMembers(members);
            updateAdminStats(members);
        } else {
            // Fetch from Firestore
            db.collection('members').get().then(snapshot => {
                const firestoreMembers = [];
                snapshot.forEach(doc => firestoreMembers.push({ ...doc.data(), id: doc.id }));
                renderAdminMembers(firestoreMembers);
                updateAdminStats(firestoreMembers);
            }).catch(err => console.error('Admin fetch error:', err));
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
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = filtered.map(m => {
            const initial = (m.name || '?').charAt(0).toUpperCase();
            const avatarContent = m.avatar
                ? `<img src="${m.avatar}" alt="avatar">`
                : initial;

            const planBadge = m.plan === 'premium'
                ? '<span class="plan-badge premium">Premium</span>'
                : '<span class="plan-badge basic">Basic</span>';

            const statusClass = m.status === 'active' ? 's-active' : (m.status === 'expired' ? 's-expired' : 's-pending');
            const statusLabel = m.status === 'active' ? 'Ενεργό' : (m.status === 'expired' ? 'Ληγμένο' : 'Εκκρεμές');
            const statusDotClass = m.status;

            const activateDisabled = m.status === 'active' ? 'disabled' : '';
            const checkinDisabled = m.status !== 'active' ? 'disabled' : '';

            return `
        <tr>
          <td>
            <div class="member-cell">
              <div class="member-cell-avatar">${avatarContent}</div>
              <span class="member-cell-name">${m.name || '—'}</span>
            </div>
          </td>
          <td>${m.email || '—'}</td>
          <td>${planBadge}</td>
          <td>
            <span class="table-status ${statusClass}">
              <span class="status-dot ${statusDotClass}"></span>
              ${statusLabel}
            </span>
          </td>
          <td>${formatDate(m.signupDate)}</td>
          <td>${(m.checkins || []).length}</td>
          <td>
            <button class="admin-action-btn activate-btn" onclick="activateMember('${m.email}')" ${activateDisabled}>
              <i class="fas fa-check"></i> Ενεργοποίηση
            </button>
            <button class="admin-action-btn checkin-btn" onclick="checkinMember('${m.email}')" ${checkinDisabled}>
              <i class="fas fa-map-marker-check"></i> Check-in
            </button>
          </td>
        </tr>
      `;
        }).join('');
    }

    // ===== ADMIN ACTIONS =====
    window.activateMember = function (email) {
        if (CONFIG.useDemoMode) {
            const member = findMemberByEmail(email);
            if (member) {
                const now = new Date();
                const expiry = new Date(now);
                expiry.setMonth(expiry.getMonth() + 13); // 12 months + 1 free month

                member.status = 'active';
                member.activationDate = now.toISOString();
                member.expiryDate = expiry.toISOString();
                saveMembers();
                refreshAdminPanel();
            }
        } else {
            const now = new Date();
            const expiry = new Date(now);
            expiry.setMonth(expiry.getMonth() + 13);

            db.collection('members').doc(email).update({
                status: 'active',
                activationDate: now.toISOString(),
                expiryDate: expiry.toISOString()
            }).then(() => refreshAdminPanel())
                .catch(err => console.error('Activate error:', err));
        }
    };

    window.checkinMember = function (email) {
        const now = new Date().toISOString();

        if (CONFIG.useDemoMode) {
            const member = findMemberByEmail(email);
            if (member) {
                if (!member.checkins) member.checkins = [];
                member.checkins.push(now);
                member.totalVisits = member.checkins.length;
                saveMembers();
                refreshAdminPanel();

                // Visual feedback
                showToast(`✅ Check-in: ${member.name}`);
            }
        } else {
            db.collection('members').doc(email).update({
                checkins: firebase.firestore.FieldValue.arrayUnion(now),
                totalVisits: firebase.firestore.FieldValue.increment(1)
            }).then(() => {
                refreshAdminPanel();
                showToast(`✅ Check-in recorded`);
            }).catch(err => console.error('Checkin error:', err));
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
        const now = new Date();
        members.forEach(m => {
            if (m.status === 'active' && m.expiryDate) {
                if (new Date(m.expiryDate) < now) {
                    m.status = 'expired';
                }
            }
        });
        saveMembers();
    }

    // Run expiry check
    if (CONFIG.useDemoMode) {
        // Delay to ensure members are loaded
        setTimeout(checkExpirations, 1000);
    }

})();
