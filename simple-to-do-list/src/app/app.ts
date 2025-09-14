import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoListComponent } from './to-do-list/to-do-list';


@Component({
  selector: 'app-root',
  imports: [CommonModule, TodoListComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('simple-to-do-list');
}
