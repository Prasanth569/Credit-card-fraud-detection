from flask import Flask, render_template, request
import pickle
import numpy as np
import pandas as pd

app = Flask(__name__)

model = pickle.load(open("saved_model.pkl","rb"))

columns = [
"Time","V1","V2","V3","V4","V5","V6","V7","V8","V9",
"V10","V11","V12","V13","V14","V15","V16","V17","V18",
"V19","V20","V21","V22","V23","V24","V25","V26","V27",
"V28","Amount"
]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():

    amount = float(request.form["amount"])
    time = float(request.form["time"])

    values = np.random.normal(size=(1,28))

    features = [time] + list(values[0]) + [amount]

    df = pd.DataFrame([features], columns=columns)

    prediction = model.predict(df)

    if prediction[0] == 1:
        result = "Fraud Transaction ❌"
    else:
        result = "Legitimate Transaction ✅"

    return render_template("index.html", prediction_text=result)

if __name__ == "__main__":
    app.run(debug=True)