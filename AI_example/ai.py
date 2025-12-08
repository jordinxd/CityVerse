import ollama
from pathlib import Path

# Instellingen
IMAGE_PATH = "test.png" 
MODEL_NAME = "llama3.2-vision"

def analyze_image(image_path):
    print(f"Start analyse met model: {MODEL_NAME}...")
    
    # Controleer of bestand bestaat
    if not Path(image_path).exists():
        return "Error: Afbeelding niet gevonden."

    try:
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
        # Return de content van het bericht
        return response['message']['content']

    except Exception as e:
        return f"Er is een fout opgetreden: {str(e)}"

# Script uitvoeren
if __name__ == "__main__":
    result = analyze_image(IMAGE_PATH)
    print("Resultaat van het model:")
    print(result)