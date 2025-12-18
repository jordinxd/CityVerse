import ollama
import json
import os
from pathlib import Path

# --- INSTELLINGEN ---
# We bepalen het pad dynamisch, zodat Java het bestand altijd kan vinden
# ongeacht vanuit welke map het commando wordt uitgevoerd.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_PATH = os.path.join(SCRIPT_DIR, "test.png") # Zorg dat test.png in de AI_Functionality map staat
MODEL_NAME = "moondream"

def analyze_image(image_path):
    # 1. Check of plaatje bestaat
    if not Path(image_path).exists():
        # Return een JSON object met de foutmelding, zodat de UI dit snapt
        return json.dumps({
            "quality_of_life_score": 0,
            "justification": f"Error: Afbeelding niet gevonden op pad: {image_path}"
        })

    try:
        # 2. Vraag het aan Ollama
        response = ollama.chat(
            model=MODEL_NAME,
            format='json',  # Forceer JSON output van het model
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
                "temperature": 0.2, # Laag houden voor consistentere, feitelijke antwoorden
            }
        )
        
        # 3. Geef het antwoord terug (dit is al een JSON string)
        return response['message']['content']

    except Exception as e:
        # 4. Vang crashes af (bijv. als Ollama niet draait)
        return json.dumps({
            "quality_of_life_score": 0,
            "justification": f"Systeem Error: {str(e)}"
        })

# --- HOOFD PROGRAMMA ---
if __name__ == "__main__":
    # Voer de analyse uit
    json_result = analyze_image(IMAGE_PATH)
    
    # Dit is de ENIGE print in het hele bestand.
    # Dit wordt door Java opgevangen en teruggestuurd naar je website.
    print(json_result)