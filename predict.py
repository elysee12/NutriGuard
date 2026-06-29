import sys
import json
import joblib
import pandas as pd
import os
import warnings

# Disable warnings for cleaner output
warnings.filterwarnings("ignore")

def predict_loop(model):
    """
    Persistent mode: reads JSON lines from stdin and prints JSON results to stdout.
    This avoids reloading the 131MB model for every prediction.
    """
    for line in sys.stdin:
        try:
            line = line.strip()
            if not line:
                continue
            
            features = json.loads(line)
            df = pd.DataFrame([features])
            
            prediction = model.predict(df)[0]
            probabilities = model.predict_proba(df)[0]
            stunted_index = list(model.classes_).index('Stunted')
            risk_score = probabilities[stunted_index] * 100

            result = {
                "prediction": str(prediction),
                "risk_score": float(risk_score)
            }
            print(json.dumps(result), flush=True)

        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    # Load the model once
    model_path = os.path.join(os.path.dirname(__file__), 'nutriguard_model.pkl')
    try:
        model = joblib.load(model_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load model: {str(e)}"}))
        sys.exit(1)

    # Check if we should run in persistent mode
    if len(sys.argv) > 1 and sys.argv[1] == "--persistent":
        predict_loop(model)
    else:
        # Original single-shot mode for backward compatibility
        try:
            input_data = sys.stdin.read()
            if input_data:
                features = json.loads(input_data)
                df = pd.DataFrame([features])
                prediction = model.predict(df)[0]
                probabilities = model.predict_proba(df)[0]
                stunted_index = list(model.classes_).index('Stunted')
                risk_score = probabilities[stunted_index] * 100
                print(json.dumps({"prediction": str(prediction), "risk_score": float(risk_score)}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
