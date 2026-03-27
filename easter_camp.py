import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx_text = f.read()

# Remove old banner entirely
idx_text = re.sub(r'<!-- EASTER CAMP BANNER -->.*?</section>', '', idx_text, flags=re.DOTALL)

# Inject hero overlay
hero_injection = """    <div class="hero-easter-overlay">
      <img src="IMG_1045.jpg" alt="Kids Easter Camp Αγγελόσπιτο" class="easter-hero-img">
      <a href="yphresies.html#easter-camp-section" class="btn btn-primary btn-3d easter-cta-btn">Μάθετε για το Easter Camp!</a>
    </div>

    <!-- Floating 3D particles for depth -->"""
idx_text = idx_text.replace('<!-- Floating 3D particles for depth -->', hero_injection)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx_text)

# 2. Update yphresies.html
with open('yphresies.html', 'r', encoding='utf-8') as f:
    yph_text = f.read()

yph_text = yph_text.replace('<div class="happy-hour-card-wrapper">', '<div class="events-cards-container">')

easter_card = """
                <div class="happy-hour-event-card animate-on-scroll" id="easter-camp-section" style="border-top:5px solid #ec4899; display:flex; flex-direction:column; justify-content:space-between;">
                    <div class="event-showcase-badge" style="background:#ec4899;">🐰 Εορταστικό Event</div>
                    
                    <div class="easter-camp-card-img-wrapper" style="width:100%; height:260px; overflow:hidden; border-radius:16px 16px 0 0; margin-bottom:15px; grid-area: auto;">
                        <img src="IMG_1045.jpg" alt="Kids Easter Camp" style="width:100%; height:100%; object-fit:contain; background:#fdfdfd;">
                    </div>

                    <div class="happy-hour-card-body" style="padding-top:0; flex-grow:1; display:flex; flex-direction:column;">
                        <h3>Kids Easter Camp!</h3>
                        <p class="happy-hour-offer-text">Ελάτε να περάσουμε ένα αξέχαστο Πάσχα με δημιουργία, παιχνίδι και φαντασία!</p>
                        
                        <div class="event-showcase-meta">
                            <span class="event-date"><i class="fas fa-calendar-alt"></i> 6, 7, 8, 15, 16, 17 Απριλίου</span>
                            <span class="event-time"><i class="fas fa-clock"></i> 8πμ - 2μμ ή 8πμ - 4μμ</span>
                        </div>

                        <div class="happy-hour-includes" style="margin-top:15px; margin-bottom:20px; flex-grow:1;">
                            <div class="include-item"><i class="fas fa-check-circle" style="color:#ec4899;"></i> Πασχαλινές κατασκευές & ζωγραφική</div>
                            <div class="include-item"><i class="fas fa-check-circle" style="color:#ec4899;"></i> Κυνήγι πασχαλινού αυγού</div>
                            <div class="include-item"><i class="fas fa-check-circle" style="color:#ec4899;"></i> Θεατρικό παιχνίδι & Ζαχαροπλαστική</div>
                            <div class="include-item"><i class="fas fa-heart" style="color:#ec4899;"></i> <strong>4-10 ετών | Έκπτωση 20% στα αδερφάκια!</strong></div>
                        </div>

                        <a href="tel:6977614546" class="btn btn-primary btn-3d event-cta happy-hour-card-cta" style="background:linear-gradient(135deg, #ec4899, #f59e0b); border:none; width:100%; margin-top:auto;">
                            <i class="fas fa-phone-alt"></i> 6977614546
                        </a>
                    </div>
                </div>
"""

yph_text = re.sub(r'(</p>\s*</div>\s*</div>)(\s*</div>\s*</section>)', r'\1' + easter_card + r'\2', yph_text)

with open('yphresies.html', 'w', encoding='utf-8') as f:
    f.write(yph_text)

# 3. Update styles.css
css_injection = """
/* --- EASTER CAMP UPDATES --- */
.hero-easter-overlay {
    position: absolute;
    top: 140px;
    right: 8%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    animation: floatOverlay 6s ease-in-out infinite;
}

@keyframes floatOverlay {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
}

.easter-hero-img {
    width: 250px;
    border-radius: 16px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    border: 5px solid white;
    transform: rotate(6deg);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hero-easter-overlay:hover .easter-hero-img {
    transform: rotate(0deg) scale(1.08);
}

.easter-cta-btn {
    font-size: 0.95rem !important;
    padding: 12px 24px !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #ec4899, #f59e0b) !important;
    border: none !important;
    box-shadow: 0 8px 25px rgba(236,72,153,0.4) !important;
}

.events-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 40px;
    width: 100%;
    margin-top: 20px;
}

@media (max-width: 992px) {
    .events-cards-container {
        grid-template-columns: 1fr;
    }
    
    .hero-easter-overlay {
        position: relative;
        top: 0;
        right: 0;
        margin: 120px auto 20px;
        transform: scale(0.95);
        animation: none;
    }
    
    .hero-easter-overlay .easter-hero-img {
        width: 280px;
        transform: rotate(0deg);
    }
    
    .hero {
        min-height: auto;
        padding-bottom: 60px;
    }
    
    .hero-content {
        padding-top: 10px;
    }
}
"""

with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css_injection)

print("Easter Camp HTML & CSS restructuring complete.")
