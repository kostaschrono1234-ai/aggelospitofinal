import os
import re

# 1. & 2. Fixing HTML files
html_files = [f for f in os.listdir('.') if f.endswith('.html')]
for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove Συχνές Ερωτήσεις link
    content = re.sub(r'\s*<a href="yphresies\.html#faq">Συχνές Ερωτήσεις</a>', '', content)
    
    # Fix Club Μελών link to inherit default styling
    content = re.sub(r'<a href="club\.html"[^>]*>Club Μελών</a>', '<a href="club.html">Club Μελών</a>', content)
    
    # In club.html, modify the Hero text slightly to match the prompt's request
    if file == 'club.html':
        content = re.sub(r'<h1 class="club-hero-title[^>]*>.*?</h1>', '<h1 class="club-hero-title animate-on-scroll">Καλώς ήρθατε στο<br><span class="highlight-text">Club Μελών του Αγγελόσπιτου!</span></h1>', content, flags=re.DOTALL)
        content = re.sub(r'<span>Σύνδεση με Google</span>', '<span>Είσοδος με Google</span>', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

# 3. Update club-app.js to always start in Welcome state
with open('club-app.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace initDemoSession to force logout state and clear localStorage so it always shows screenLogin
new_demo_session = """function initDemoSession() {
        // ALWAYS start logged out/welcome state as requested in Phase 2
        currentUser = null;
        localStorage.removeItem('aggelospito_club_user');
        showScreen('screenLogin');
    }"""
js_content = re.sub(r'function initDemoSession\(\) \{.*?(?=\n    function saveMembers)', new_demo_session + '\n\n', js_content, flags=re.DOTALL)

with open('club-app.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

# 4. Optimize club-styles.css
with open('club-styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove heavy backdrop-filters and replace transition: all
css = re.sub(r'backdrop-filter:\s*blur\([^)]+\);', '', css)
css = re.sub(r'-webkit-backdrop-filter:\s*blur\([^)]+\);', '', css)
css = re.sub(r'transition:\s*all\s+([^;]+);', r'transition: transform \1, opacity \1;', css)
css = re.sub(r'transition:\s*border-color\s+[^,]+,\s*box-shadow\s+[^;]+;', 'transition: transform 0.3s ease;', css) # simplify heavy form transitions if any

with open('club-styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Phase 2 Fixes Applied")
