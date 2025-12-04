; Presses '7' every 2 seconds using AutoHotkey
; Run by double-clicking this file if AutoHotkey is installed, or via: "AutoHotkey.exe press7.ahk"
#NoTrayIcon
SetTimer, Press7, 2000
Return

Press7:
    Send, 7
Return
