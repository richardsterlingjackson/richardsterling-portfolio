# 🧠 MNIST Image Classifier with TensorFlow & Keras

This project builds and trains a Convolutional Neural Network (CNN) to classify handwritten digits from the [MNIST dataset](http://yann.lecun.com/exdb/mnist/). It uses TensorFlow's Keras API and visualizes predictions using Matplotlib.

👈 [Back to Portfolio Overview](../README.md)

---

## Requirements

Make sure you have the following Python packages installed globally:

```bash
pip install tensorflow matplotlib numpy
```

## How to Run

Clone the repository and run the script:

```bash
python image-classifier.py
```

## What it Does

- Loads and preprocesses the MNIST dataset  
- Normalizes pixel values to [0, 1]  
- Reshapes images to include a channel dimension  
- Converts labels to one-hot encoded vectors  
- Builds a CNN with three convolutional layers  
- Trains the model for 5 epochs with 10% validation split  
- Evaluates accuracy on the test set  
- Predicts and visualizes the first test image  

## Model Architecture

Input: 28x28x1 grayscale image
↓ Conv2D (32 filters, 3x3) + ReLU
↓ MaxPooling2D (2x2)
↓ Conv2D (64 filters, 3x3) + ReLU
↓ MaxPooling2D (2x2)
↓ Conv2D (64 filters, 3x3) + ReLU
↓ Flatten
↓ Dense (64 units) + ReLU
↓ Dense (10 units) + Softmax

## Sample Output

Test accuracy: 0.9874
Predictions for first test image: 7

## Saving the Model

To save the trained model, you can add:

```
model.save("mnist_cnn_model.h5")
```

👈 [Back to Portfolio Overview](../README.md)