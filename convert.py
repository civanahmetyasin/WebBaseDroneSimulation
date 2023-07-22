import pandas as pd
import json

# Load the data from the CSV file
data = pd.read_csv("Raw Data.csv", sep="\t", decimal=",", skipinitialspace=True)

# Clean the column names
data.columns = data.columns.str.strip()

# Convert the data into the desired format
controls = []
for index, row in data.iterrows():
    control = {
        "roll": row["Gyroscope x (rad/s)"] * 10,
        "pitch": row["Gyroscope y (rad/s)"] * 10,
        "yaw": row["Gyroscope z (rad/s)"] * 10,
        "throttle": row["Time (s)"] * 100,
    }
    controls.append(control)

# Save the data to a JSON file
with open("controls.json", "w") as f:
    json.dump(controls, f)
