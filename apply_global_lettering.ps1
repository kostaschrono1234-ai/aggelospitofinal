$ErrorActionPreference = "Stop"

$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$styleCode = "`n    <style>`n    @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');`n    </style>`n"

$htmlFiles = Get-ChildItem -Path . -Filter *.html
foreach($f in $htmlFiles) {
    if (Test-Path $f.FullName) {
        $c = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)
        
        # Add <style> import into <head>
        if ($c -notmatch "family=Lobster&display=swap") {
            $c = $c -replace '(?i)(</head>)', "$styleCode`$1"
        }
        
        [System.IO.File]::WriteAllText($f.FullName, $c, $utf8NoBom)
    }
}

$cssFile = "styles.css"
if (Test-Path $cssFile) {
    $c = [System.IO.File]::ReadAllText($cssFile, $utf8NoBom)
    
    $lobsterClass = "`n.lobster-regular {`n  font-family: `"Lobster`", sans-serif;`n  font-weight: 400;`n  font-style: normal;`n}`n"
    if ($c -notmatch "\.lobster-regular") {
        $c += $lobsterClass
    }
    
    # Change CSS variables to natively apply the lettering to the "whole website everywhere" securely!
    $c = $c -replace "--font-heading: 'Lobster', cursive;", "--font-heading: `"Lobster`", sans-serif;"
    $c = $c -replace "--font-nav: 'Montserrat', sans-serif;", "--font-nav: `"Lobster`", sans-serif;"
    $c = $c -replace "--font-body: 'Open Sans', sans-serif;", "--font-body: `"Lobster`", sans-serif;"
    
    [System.IO.File]::WriteAllText($cssFile, $c, $utf8NoBom)
}

Write-Output "Global Lettering Safely Updated!"
