import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.config import settings
import google.generativeai as genai

genai.configure(api_key=settings.GEMINI_API_KEY)
for m in genai.list_models():
    if "generateContent" in m.supported_generation_methods:
        print(m.name)
