# Import necessary libraries
import numpy as np
import tensorflow as tf
from tensorflow import keras 
import matplotlib.pyplot as plt


# Load and preprocess the MNIST dataset
(train_images, train_labels), (test_images, test_labels) = keras.datasets.mnist.load_data()

# Normalize the images to a range of 0 to 1
train_images = train_images /255.0
test_images = test_images /255.0

# Reshape the images to add a channel dimension (28, 28, 1)
train_images = train_images.reshape((train_images.shape[0], 28, 28, 1))
test_images = test_images.reshape((test_images.shape[0], 28, 28, 1))

# Convert labels to one-hot encoding format
train_labels = keras.utils.to_categorical(train_labels)
test_labels = keras.utils.to_categorical(test_labels)

# Build the CNN model
model = keras.Sequential([
    # First convolutional layer
    keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    keras.layers.MaxPooling2D((2, 2)),
    # Second convolutional layer
    keras.layers.Conv2D(64, (3, 3), activation='relu'),
    keras.layers.MaxPooling2D((2, 2)),
    # Third convolutional layer
    keras.layers.Conv2D(64, (3, 3), activation='relu'),
    # Flatten 3D outputs and add dense layer
    keras.layers.Flatten(),
    keras.layers.Dense(64, activation='relu'),
    # Output layer with 10 neurons for 10 digit classes
    keras.layers.Dense(10, activation='softmax')
])

# Compile the model
model.compile(optimizer='adam',
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# Train the model
model.fit(train_images, train_labels, epochs=5, batch_size=64, validation_split=0.1)

# Evaluate the model on the test dataset
test_loss, test_acc = model.evaluate(test_images, test_labels)
print(f'Test accuracy: {test_acc}')# Save the trained model

# Make predictions on test images
predictions = model.predict(test_images)
print(f'Predictions for first test image: {np.argmax(predictions[0])}')

# Visualize the first test image and its prediction
plt.imshow(test_images[0].reshape(28, 28), cmap='gray')
plt.title(f'Predicted Label: {predictions[0].argmax()}')
plt.show()
