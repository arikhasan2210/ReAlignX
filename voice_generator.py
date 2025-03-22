from gtts import gTTS

text = "Are you falling off the screen? Let me call the ambulance!"
tts = gTTS(text, lang='en')
tts.save("fallAlert.mp3")

print("MP3 file saved as alertSound1.mp3")
