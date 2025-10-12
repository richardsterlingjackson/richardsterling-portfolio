# Spam Email Classifier — Logistic Regression on Spambase

A machine learning project that classifies emails as spam or not spam using logistic regression. Built with scikit-learn and visualized with Seaborn, this project demonstrates end-to-end model training, evaluation, and performance visualization.

👈 [Back to Portfolio Overview](../README.md)

---

## Project Overview

This project uses the Spambase dataset from the UCI Machine Learning Repository (via Kaggle), which contains 57 numerical features extracted from email content. The goal is to train a binary classifier that predicts whether an email is spam.

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

**Source**: Spambase Dataset on Kaggle
**Features**: 57 continuous variables (e.g., frequency of specific words characters, capital letter usage)
**Target**: 1 for spam, 0 for non-spam

---

## How to Run

Install dependencies
```bash
pip install pandas scikit-learn matplotlib seaborn
```

Run the program:
```bash
python spam_filter.py
```
---

## Sample Output

```
Accuracy: 0.94
Precision: 0.92
Recall: 0.90
F1 Score: 0.91
```

A confusion matrix will be displayed to visualize classification performance

---

## What it Does

1. 	Load and preprocess the dataset
2. 	Split into training and testing sets
3. 	Train a LogisticRegression model
4. 	Predict and evaluate using:
    - Accuracy
    - Precision
    - Recall
    - F1 Score
5. 	Visualize the confusion matrix with Seaborn

---

## Why This Project?

This project explores how structured data can reveal patterns in digital communication—an exercise in translating behavioral signals into interpretable, actionable insights. It reflects my interest in mapping emotional and environmental signals into meaningful design and decision-making tools.

---

👈 [Back to Portfolio Overview](../README.md)