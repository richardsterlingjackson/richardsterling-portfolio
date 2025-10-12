# Spam Email Classifier — Logistic Regression on Spambase

A machine learning project that classifies human physical activities using sensor data. Built with scikit-learn and visualized with Seaborn, this project demonstrates supervised learning, model evaluation, and performance visualization.

👈 [Back to Portfolio Overview](../README.md)

---

## Project Overview

This project uses the Human Activity Recognition (HAR) dataset collected from smartphone accelerometers and gyroscopes. It contains time-series features extracted from motion signals, labeled with six distinct activities such as walking, sitting, and laying. The goal is to train a classifier that can accurately predict the activity based on sensor input.

---

## Technologies Used

| Tool            | Purpose                          |
|-----------------|----------------------------------|
| pandas          | Data loading and manipulation    |
| scikit-learn    | Model training and evaluation    |
| matplotlib      | Plot rendering                   |
| seaborn         | Confusion matrix visualization   |

---

## Dataset

**Source**: Human Activity Recognition Dataset on Kaggle
**Features**: 561 time-series variables derived from accelerometer and gyroscope signals
**Target**: - One of six activities: Walking, Walking Upstairs, Walking Downstairs, Sitting, Standing, Laying

---

## How to Run

Install dependencies
```bash
pip install pandas scikit-learn matplotlib seaborn
```

Run the program:
```bash
python har.py
```
---

## Sample Output

```
Accuracy: 0.96
Precision: 0.95
Recall: 0.94
F1 Score: 0.95
```

A confusion matrix will be displayed to visualize classification performance

---

## What it Does

1. 	Load and preprocess the dataset
2. 	Split into training and testing sets
3. 	Train a RandomFOrestClassifier
4. 	Predict and evaluate using:
    - Accuracy
    - Precision
    - Recall
    - F1 Score
5. 	Visualize the confusion matrix with Seaborn

---

## Why This Project?

This project explores how physical movement that is captured as raw sensor data can be translated into structured and interpretable insights. It reflects my interest in mapping environmental and behavioral signals into meaningful decision tools. By modeling human activity, I’m bridging the gap between embodied experience and algorithmic understanding.

---

👈 [Back to Portfolio Overview](../README.md)