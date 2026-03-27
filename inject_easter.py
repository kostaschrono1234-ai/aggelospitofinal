import re

# 1. Inject HTML
easter_html = """
  <!-- EASTER CAMP BANNER -->
  <section class="event-banner easter-camp-banner" id="easter-camp">
    <div class="easter-camp-inner animate-on-scroll">
      <div class="easter-camp-grid">
        <div class="easter-camp-image">
           <img src="eastercamp.png" alt="Kids Easter Camp Αγγελόσπιτο" loading="lazy">
        </div>
        <div class="easter-camp-content">
          <div class="event-banner-badge easter-badge">
            <span class="event-banner-badge-icon">🐰</span>
            <span>Εορταστικό Event</span>
          </div>
          <h2>Kids Easter Camp!</h2>
          <p class="easter-camp-desc">Ελάτε να περάσουμε ένα αξέχαστο Πάσχα με δημιουργία, παιχνίδι και φαντασία!</p>
          <ul class="easter-camp-features">
             <li><i class="fas fa-paint-brush"></i> Πασχαλινές κατασκευές &amp; ζωγραφική</li>
             <li><i class="fas fa-egg"></i> Κυνήγι πασχαλινού αυγού</li>
             <li><i class="fas fa-theater-masks"></i> Θεατρικό παιχνίδι &amp; ομαδικές δραστηριότητες</li>
             <li><i class="fas fa-music"></i> Μουσικοκινητικά παιχνίδια</li>
             <li><i class="fas fa-cookie-bite"></i> Ζαχαροπλαστική και μαγειρική κάθε μέρα</li>
             <li><i class="fas fa-smile-beam"></i> Ατελείωτο παιχνίδι στον χώρο!</li>
          </ul>
          
          <div class="easter-camp-meta">
            <div class="meta-item">
              <i class="fas fa-calendar-alt"></i>
              <div>
                 <strong>6, 7, 8, 15, 16, 17 Απριλίου 2026</strong>
                 <span>8-2 μ.μ. ή 8-4 μ.μ.</span>
              </div>
            </div>
            <div class="meta-item heart-item">
              <i class="fas fa-heart"></i>
              <div>
                 <strong>4-10 ετών</strong>
                 <span class="discount-text">Έκπτωση 20% στα αδερφάκια!</span>
              </div>
            </div>
          </div>

          <a href="tel:6977614546" class="btn btn-primary btn-3d easter-camp-cta">
            <i class="fas fa-phone-alt"></i>
            <span>Κλείστε Θέση (6977614546)</span>
          </a>
        </div>
      </div>
    </div>
  </section>
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Insert after happy hour banner
if '<!-- EASTER CAMP BANNER -->' not in content:
    content = re.sub(r'(</section>\s*<!-- INFO BAR -->)', r'</section>\n' + easter_html + r'\n  <!-- INFO BAR -->', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Append CSS
easter_css = """
/* ===== EASTER CAMP BANNER ===== */
.easter-camp-banner {
    padding: 80px 24px;
    background: transparent;
    position: relative;
    overflow: hidden;
}

.easter-camp-inner {
    max-width: 1200px;
    margin: 0 auto;
    background: #fff;
    border-radius: 36px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
    position: relative;
    overflow: hidden;
    padding: 10px;
}

.easter-camp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    align-items: center;
}

.easter-camp-image {
    width: 100%;
    height: 100%;
    border-radius: 28px;
    overflow: hidden;
    position: relative;
}

.easter-camp-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #FF66A1; /* Fallback poster color */
    transform: scale(1.01);
    transition: transform 0.5s ease;
}

.easter-camp-inner:hover .easter-camp-image img {
    transform: scale(1.05);
}

.easter-camp-content {
    padding: 40px 50px;
}

.easter-badge {
    background: rgba(255, 102, 161, 0.15);
    color: #FF66A1;
    border: none;
    align-self: flex-start;
    margin-bottom: 20px;
}

.easter-camp-content h2 {
    font-size: 2.8rem;
    color: var(--pink-primary);
    font-family: var(--font-heading);
    margin-bottom: 12px;
    line-height: 1.1;
}

.easter-camp-desc {
    font-size: 1.1rem;
    color: var(--text-gray);
    margin-bottom: 24px;
}

.easter-camp-features {
    list-style: none;
    padding: 0;
    margin: 0 0 32px 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.easter-camp-features li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--text-dark);
}

.easter-camp-features li i {
    color: #FF66A1;
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
}

.easter-camp-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 32px;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #EAFCF0;
    padding: 16px 24px;
    border-radius: 60px;
    flex: 1;
    min-width: 250px;
}

.meta-item i {
    font-size: 1.8rem;
    color: #10B981;
}

.heart-item {
    background: #FFF0F5;
}

.heart-item i {
    color: #EC4899;
}

.meta-item div {
    display: flex;
    flex-direction: column;
}

.meta-item strong {
    font-size: 1.15rem;
    color: var(--text-dark);
}

.meta-item span {
    font-size: 0.95rem;
    color: var(--text-gray);
}

.discount-text {
    font-weight: 700;
    color: #EC4899 !important;
}

.easter-camp-cta {
    width: 100%;
    justify-content: center;
    font-size: 1.2rem;
    padding: 18px 30px;
    background: linear-gradient(135deg, #FF66A1, #D946EF);
    border: none;
    animation: pulseGlow 2s infinite;
}

@keyframes pulseGlow {
    0% { box-shadow: 0 0 0 0 rgba(255, 102, 161, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(255, 102, 161, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 102, 161, 0); }
}

@media (max-width: 992px) {
    .easter-camp-grid {
        grid-template-columns: 1fr;
    }
    .easter-camp-image {
        max-height: 400px;
    }
}

@media (max-width: 768px) {
    .easter-camp-content {
        padding: 30px 20px;
    }
    .easter-camp-content h2 {
        font-size: 2.2rem;
    }
    .meta-item {
        border-radius: 20px;
        flex-direction: column;
        text-align: center;
        width: 100%;
    }
}
"""

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

if '/* ===== EASTER CAMP BANNER ===== */' not in css:
    with open('styles.css', 'a', encoding='utf-8') as f:
        f.write('\n' + easter_css)

print("Easter Camp HTML & CSS injected successfully.")
