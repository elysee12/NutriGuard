import sys
import json
import pickle
import pandas as pd
import os

def predict():
    try:
        # Load the model (Inzira iguma kuri file imwe)
        model_path = os.path.join(os.path.dirname(__file__), 'nutriguard_model.pkl')
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        # FATA AMAKURU AVA MURI NESTJS (Arguments)
        if len(sys.argv) < 2:
            return
        input_data = sys.argv[1] # Fata argument ya mbere (JSON string)

        features = json.loads(input_data)
        df = pd.DataFrame([features])
        
        prediction = model.predict(df)[0]
        probabilities = model.predict_proba(df)[0]
        stunted_index = list(model.classes_).index('Stunted')
        risk_score = probabilities[stunted_index] * 100

        result = {
            "prediction": str(prediction),
            "risk_score": float(risk_score)
        }
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    predict()
