import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # The universal nav-links block
    new_nav = f"""<div class="nav-links" id="navLinks">
        <a href="index.html">Αρχική</a>
        <a href="o-xwros-mas.html">Ο Χώρος μας</a>
        <a href="paidika-parti.html">Παιδικά πάρτυ</a>
        <a href="yphresies.html">Υπηρεσίες</a>
        <a href="h-istoria-mas.html">Η Ιστορία μας</a>
        <a href="entypwseis.html">Επικοινωνία</a>
        <a href="club.html">Club Μελών</a>
        <div class="nav-social">
            <a href="https://www.facebook.com/paidotopos.cafe.aggelospito/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.instagram.com/aggelospito_cafe_paidotopos/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="https://www.tiktok.com/@aggelospito.cafe" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
        </div>
    </div>"""

    # Apply active class based on filename
    active_str = f'href="{file}"'
    new_nav = new_nav.replace(active_str, f'{active_str} class="active"')

    # Replace the existing navLinks div using regex
    content = re.sub(r'<div class="nav-links" id="navLinks">.*?</div>\s*</nav>', new_nav + '\n    </nav>', content, flags=re.DOTALL)
    
    # Also globally remove FAQ link just to be completely sure (including in Footers!)
    content = re.sub(r'<a href="yphresies\.html#faq"[^>]*>.*?Συχνές Ερωτήσεις.*?</a>', '', content, flags=re.IGNORECASE)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Navbar synced across all files.")
