
import sys
import json
import pickle
import pandas as pd
import os

def predict():
    try:
        # Load the model
        model_path = os.path.join(os.path.dirname(__file__), 'nutriguard_model.pkl')
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            return

        features = json.loads(input_data)
        
        # Create a DataFrame for prediction
        # Ensure all required columns are present in the correct order
        # Numeric: ['height', 'weight', 'muac', 'age_days']
        # Categorical: ['umwana_afite_ababyeyi', 'amashuri_mama_w_umwana_yiz', 'sick', 'mmf', 'fbf', 'vup', 'ese_haba_hari_amakimbirane', 'icyo_umurera_akora', 'water', 'handwash', 'toilet', 'sex_new']
        
        df = pd.DataFrame([features])
        
        # Make prediction
        prediction = model.predict(df)[0]
        
        # Get risk score (probability of 'Stunted')
        # classes_ should contain ['Not stunted', 'Stunted']
        probabilities = model.predict_proba(df)[0]
        stunted_index = list(model.classes_).index('Stunted')
        risk_score = probabilities[stunted_index] * 100

        result = {
            "prediction": str(prediction),
            "risk_score": float(risk_score)
        }
        
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "error": str(e)
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    predict()
