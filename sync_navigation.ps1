$ErrorActionPreference = "Stop"

$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$htmlFiles = Get-ChildItem -Path . -Filter *.html
foreach($f in $htmlFiles) {
    if (Test-Path $f.FullName) {
        $c = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)
        
        # 1. Clean existing out-of-sync or missing links
        # This safely removes any existing <a href="club.html"...>Club Μελών</a>
        $c = $c -replace '(?i)<a\s+href="club\.html"[^>]*>Club Μελών</a>', ''
        
        # 2. Add to Header & Footer perfectly dynamically!
        # Every page has exactly two <a href="entypwseis.html">Επικοινωνία</a> links (one nav, one footer).
        # We inject the Club link safely immediately after them.
        $c = $c -replace '(<a\s+href="entypwseis\.html"[^>]*>Επικοινωνία</a>)', "`$1`n                <a href=`"club.html`">Club Μελών</a>"
        
        # If we are literally on club.html, we can optionally make the header link active.
        # But for continuity, we just standardise the injection securely.
        
        [System.IO.File]::WriteAllText($f.FullName, $c, $utf8NoBom)
    }
}

Write-Output "Global Navigation Synchronized!"
