import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-counter',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './counter.html',
  styleUrl: './counter.scss'
})
export class CounterComponent {

  counter: number = 0;

  increment(): void {
    this.counter++;
  } 

  decrement(): void {
    this.counter--;
  } 

  reset(): void {
    this.counter = 0;
  }

  getCounterStatus(): string {
    if (this.counter > 0) return 'Positive';
    if (this.counter < 0) return 'Negative';
    return 'Zero';
  }

  getRangeMessage(): string {
    if (this.counter >= 10) return 'High Positive Count';
    if (this.counter <= -10) return 'High Negative Count';
    return 'Single Digit';
  }

}
