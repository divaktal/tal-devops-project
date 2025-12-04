# Presses the '7' key every 2 seconds using SendKeys (sends to the active window)
# Run with PowerShell in STA mode: `powershell -STA -ExecutionPolicy Bypass -File .\src\scripts\press7.ps1`

Add-Type -AssemblyName System.Windows.Forms

try {
    while ($true) {
        [System.Windows.Forms.SendKeys]::SendWait("7")
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Error "Error sending keys: $_"
}
