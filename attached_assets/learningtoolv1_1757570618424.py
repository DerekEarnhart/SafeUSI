import math
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from itertools import product

# HFV Forward Model: Generates superimposed waveform from parameters
def generate_harmonic_field(amplitudes, frequencies, phases, num_waves, spatial_resolution=256):
    if not (len(amplitudes) == len(frequencies) == len(phases) == num_waves):
        raise ValueError("All input parameter lists must match num_waves length.")
    x_values = np.linspace(0, 1, spatial_resolution)
    F_x = np.zeros(spatial_resolution)
    for i in range(num_waves):
        A = amplitudes[i]
        f = frequencies[i]
        phi = phases[i]
        w_i_x = A * np.sin(2 * np.pi * f * x_values + phi)
        F_x += w_i_x
    return F_x

# Dataset for HFV: Generates synthetic waveform-parameter pairs
class HFVDataset(Dataset):
    def __init__(self, num_samples, max_waves=3, spatial_resolution=256):
        self.num_samples = num_samples
        self.max_waves = max_waves
        self.spatial_resolution = spatial_resolution
        self.data = []
        for _ in range(num_samples):
            num_waves = np.random.randint(1, self.max_waves + 1)
            amplitudes = np.random.uniform(0.1, 2.0, num_waves)
            frequencies = np.random.uniform(1.0, 10.0, num_waves)
            phases = np.random.uniform(0, 2 * np.pi, num_waves)
            waveform = generate_harmonic_field(amplitudes, frequencies, phases, num_waves, spatial_resolution)
            padded_amplitudes = np.concatenate([amplitudes, np.zeros(self.max_waves - num_waves)])
            padded_frequencies = np.concatenate([frequencies, np.zeros(self.max_waves - num_waves)])
            padded_phases = np.concatenate([phases, np.zeros(self.max_waves - num_waves)])
            params = np.concatenate([padded_amplitudes, padded_frequencies, padded_phases])
            self.data.append((waveform, params, num_waves))

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        waveform, params, num_waves = self.data[idx]
        return torch.tensor(waveform, dtype=torch.float32), torch.tensor(params, dtype=torch.float32), num_waves

# Neural Network Model for Inverse Problem (Waveform -> Parameters)
class InverseNet(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(InverseNet, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# Training Function for a Single Set of Hyperparameters
def train_model(hidden_size, lr, train_loader, val_loader, max_waves, spatial_resolution, epochs=5):
    output_size = 3 * max_waves  # Amplitudes, frequencies, phases (padded)
    model = InverseNet(spatial_resolution, hidden_size, output_size)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    for epoch in range(epochs):
        model.train()
        for waveform, params, _ in train_loader:
            optimizer.zero_grad()
            output = model(waveform)
            loss = criterion(output, params)
            loss.backward()
            optimizer.step()

    # Validation Loss Calculation
    model.eval()
    val_loss = 0.0
    with torch.no_grad():
        for waveform, params, _ in val_loader:
            output = model(waveform)
            val_loss += criterion(output, params).item()
    val_loss /= len(val_loader)
    return val_loss, model

# Auto-Optimization via Grid Search
def optimize_hyperparams(train_loader, val_loader, max_waves, spatial_resolution):
    hidden_sizes = [128, 256, 512]  # Grid for hidden layer size
    lrs = [0.001, 0.0001, 0.00001]  # Grid for learning rate
    best_loss = float('inf')
    best_params = None
    best_model = None
    for hidden_size, lr in product(hidden_sizes, lrs):
        loss, model = train_model(hidden_size, lr, train_loader, val_loader, max_waves, spatial_resolution)
        if loss < best_loss:
            best_loss = loss
            best_params = {'hidden_size': hidden_size, 'lr': lr}
            best_model = model
    return best_params, best_loss, best_model

# Example Usage: Run the Tool
def run_tool(train_samples=100, val_samples=20, max_waves=3, spatial_resolution=256, save_model_path=None):
    train_dataset = HFVDataset(train_samples, max_waves, spatial_resolution)
    val_dataset = HFVDataset(val_samples, max_waves, spatial_resolution)
    train_loader = DataLoader(train_dataset, batch_size=10, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=10, shuffle=False)

    best_params, best_loss, best_model = optimize_hyperparams(train_loader, val_loader, max_waves, spatial_resolution)
    
    print("Optimization Complete.")
    print(f"Best Hyperparameters: {best_params}")
    print(f"Best Validation Loss: {best_loss} (Lower values indicate better functionality; aim for <0.01 for near-100% reconstruction.)")

    if save_model_path:
        torch.save(best_model.state_dict(), save_model_path)
        print(f"Model saved to {save_model_path}")

    # Test Example on One Sample
    test_waveform, test_params, test_num_waves = val_dataset[0]
    with torch.no_grad():
        predicted_params = best_model(test_waveform.unsqueeze(0)).squeeze().numpy()
    print("\nTest Sample Reconstruction:")
    print(f"True Parameters (padded to {3 * max_waves}): {test_params.numpy()}")
    print(f"Predicted Parameters: {predicted_params}")
    print(f"Number of Waves: {test_num_waves}")

# Run the tool (customize parameters as needed)
run_tool(train_samples=100, val_samples=20, max_waves=3, spatial_resolution=256, save_model_path="wsm_model.pth")
