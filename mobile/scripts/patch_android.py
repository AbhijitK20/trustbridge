from pathlib import Path

manifest = Path('android/app/src/main/AndroidManifest.xml')
text = manifest.read_text()
if 'android.permission.INTERNET' not in text:
    text = text.replace(
        '<application',
        '    <uses-permission android:name="android.permission.INTERNET"/>\n\n    <application',
        1,
    )
if '<queries>' not in text:
    text = text.replace(
        '<application',
        '    <queries>\n'
        '        <intent>\n'
        '            <action android:name="android.intent.action.VIEW"/>\n'
        '            <data android:scheme="https"/>\n'
        '        </intent>\n'
        '    </queries>\n\n    <application',
        1,
    )
text = text.replace('android:label="trustbridge"', 'android:label="TrustBridge"')
manifest.write_text(text)
print('patched AndroidManifest.xml')
