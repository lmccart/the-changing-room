taskkill /F /IM chrome.exe
powershell Start-Process 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' ^
	'--no-first-run --user-data-dir="%TEMP%\0" --window-position=0,0 --window-size=1920,1080 --kiosk --disable-pinch --app="https://MSI7:3000/05-convo2"'
powershell Start-Process 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' ^
	'--no-first-run --user-data-dir="%TEMP%\1" --window-position=1920,0 --window-size=1920,1080 --kiosk --disable-pinch --app="https://MSI7:3000/05-convo2"'
powershell Start-Process 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' ^
	'--no-first-run --user-data-dir="%TEMP%\2" --window-position=3840,0 --window-size=1920,1080 --kiosk --disable-pinch --app="https://MSI7:3000/00-intro"'