from gtts import gTTS

text = "You've been staring at the screen for too long. Take a short break!"
tts = gTTS(text, lang='en')
tts.save("break_reminder.mp3")

print("MP3 file saved as alertSound1.mp3")
