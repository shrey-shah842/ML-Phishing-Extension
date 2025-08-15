import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
model = joblib.load('xgboost.pkl')
model_columns = joblib.load('model_columns.pkl')
print("Model Loaded")

@app.route('/predict', methods=['POST'])
def predict():
     json_ = request.json
     if not json_:
          return jsonify({'error': 'No input data provided'}), 400

     # If a single dictionary is passed, wrap it in a list
     if isinstance(json_, dict):
          json_ = [json_]

     query_df = pd.DataFrame(json_)
     query = pd.get_dummies(query_df)
     query = query.reindex(columns=model_columns, fill_value=0)
     prediction = model.predict(query)

     return jsonify({'prediction': int(prediction)}), 200


if __name__ == '__main__':
    app.run(debug=True)

