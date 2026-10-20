$pptxPath = "C:\Users\Sonu\OneDrive\Desktop\GCC ATLAS\submission\GCC-Atlas-Strategy-Deck-Final.pptx"
$pdfPath = "C:\Users\Sonu\OneDrive\Desktop\GCC ATLAS\submission\GCC-Atlas-Strategy-Deck-Final.pdf"

Write-Host "Opening PowerPoint COM..."
$ppt = New-Object -ComObject PowerPoint.Application

Write-Host "Opening $pptxPath..."
# Open(FileName, ReadOnly, Untitled, WithWindow)
$pres = $ppt.Presentations.Open($pptxPath, 1, 0, 0)

Write-Host "Exporting to PDF: $pdfPath..."
$pres.SaveAs($pdfPath, 32)
$pres.Close()

Write-Host "Closing PowerPoint..."
$ppt.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

if (Test-Path $pdfPath) {
    $size = (Get-Item $pdfPath).Length
    Write-Host "SUCCESS: Generated $pdfPath ($size bytes)"
} else {
    Write-Error "Failed to generate $pdfPath"
}
