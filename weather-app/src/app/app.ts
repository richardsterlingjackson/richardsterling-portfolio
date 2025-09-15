import { Component, signal } from '@angular/core';
import { WeatherComponent } from './weather/weather';

@Component({
  selector: 'app-root',
  imports: [WeatherComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('weather-app');
}
