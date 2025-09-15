import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WeatherService } from '../services/weather/weather';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './weather.html',
  styleUrls: ['./weather.scss']
})
export class WeatherComponent {
  weatherForm: FormGroup;
  weatherData: any = null;
  temperatureEmoji: string | null = null;
  humidityEmoji: string | null = null;
  descriptionEmoji: string | null = null;
  windEmoji: string | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private weatherService: WeatherService) {
    this.weatherForm = this.fb.group({
      city: ['']
    });
  }

  getTemperatureEmoji(tempF: number): string {
    if (tempF <= 32) return '❄️';
    if (tempF > 32 && tempF <= 50) return '🥶';
    if (tempF > 50 && tempF <= 68) return '🧥';
    if (tempF > 68 && tempF <= 86) return '😎';
    return '🥵';
  }

  getHumidityEmoji(humidity: number): string {
    if (humidity < 30) return '💨';
    if (humidity >= 30 && humidity <= 60) return '🙂';
    return '💦';
  }

  getDescriptionEmoji(description: string): string {
    const emojiMap: { [key: string]: string } = {
      'clear sky': '☀️',
      'few clouds': '🌤️',
      'scattered clouds': '⛅',
      'broken clouds': '🌥️',
      'overcast clouds': '☁️',
      'light rain': '🌦️',
      'moderate rain': '🌧️',
      'heavy intensity rain': '🌧️💧',
      'thunderstorm': '⛈️',
      'snow': '❄️',
      'mist': '🌫️',
    };
    return emojiMap[description] || '❔';
  }

  fetchWeather() {
    const rawCity = this.weatherForm.value.city;
    const city = rawCity?.trim();

    // Reset state before doing anything
    this.weatherData = null;
    this.temperatureEmoji = null;
    this.humidityEmoji = null;
    this.descriptionEmoji = null;
    this.windEmoji = null;
    this.errorMessage = null;

    if (!city) {
      this.errorMessage = 'Please enter a city name or your location.';
      return;
    }

    this.isLoading = true;

    this.weatherService.getWeather(city).subscribe({
      next: (data) => {
        this.weatherData = data;
        this.temperatureEmoji = this.getTemperatureEmoji(data.main.temp);
        this.humidityEmoji = this.getHumidityEmoji(data.main.humidity);
        this.descriptionEmoji = this.getDescriptionEmoji(data.weather[0].description);
        this.windEmoji = '💨';
      },
      error: (err) => {
        console.error('Weather fetch error:', err);
        this.errorMessage = 'Error fetching weather data. Please try again.';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}