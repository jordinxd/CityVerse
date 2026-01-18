import ollama
import json
import os
import sys  
from pathlib import Path

# --- INSTELLINGEN ---
MODEL_NAME = "moondream"

# Java sends path as argument
if len(sys.argv) > 1:
    IMAGE_PATH = sys.argv[1]
else:
    # Fallback when testing wo Java
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    IMAGE_PATH = os.path.join(SCRIPT_DIR, "city_2.jpg") 

def analyze_image(image_path):
    # 1. Check for image
    if not Path(image_path).exists():
        return json.dumps({
            "quality_of_life_score": -1,
            "justification": f"Python Error: Afbeelding niet gevonden op pad: {image_path}"
        })

    try:
        # 2. Vraag het aan Ollama
        response = ollama.chat(
            model=MODEL_NAME,
            format='json',
            messages=[
                {
                    'role': 'user',
                    'content': (
                        "You are an expert visual analyst. Analyze this image for urban Quality of Life (QoL). "
                        "Identify visual cues such as greenery, infrastructure condition, cleanliness, and building types. "
                        "Provide a JSON response with exactly two fields: "
                        "1. 'quality_of_life_score' (integer 0-100). "
                        "2. 'justification' (concise explanation referencing visual cues). "
                        "Do not include markdown formatting or extra text, just the JSON object."
                    ),
                    'images': [image_path]
                }
            ],
            options={
                "temperature": 0.2, 
            }
        )
        
        # 3. Geef het antwoord terug
        return response['message']['content']

    except Exception as e:
        return json.dumps({
            "quality_of_life_score": -1,
            "justification": f"Python Systeem Error: {str(e)}"
        })

if __name__ == "__main__":
    # Voer de analyse uit
    print(analyze_image(IMAGE_PATH))