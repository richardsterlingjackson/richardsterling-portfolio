import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-to-do-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './to-do-list.html',
  styleUrls: ['./to-do-list.scss']
})
export class TodoListComponent {
  tasks: string[] = [];
  newTask: string = '';
  autoRemoveEnabled: { [task: string]: boolean } = {};
  countdownMinutes: { [task: string]: number } = {};
  timers: { [task: string]: any } = {};

  addTask() {
    if (this.newTask) {
      const task = this.newTask.trim();
      this.tasks.push(task);
      this.autoRemoveEnabled[task] = false;
      this.countdownMinutes[task] = 1; // default to 1 minute
      this.newTask = '';
    }
  }

    toggleAutoRemove(task: string) {
      clearTimeout(this.timers[task]);

    if (this.autoRemoveEnabled[task] && this.countdownMinutes[task] > 0) {
      const ms = this.countdownMinutes[task] * 60 * 1000;
      this.timers[task] = setTimeout(() => {
        this.removeTask(task);
      }, ms);
    }
  }

   removeTask(task: string) {
    this.tasks = this.tasks.filter(t => t !== task);
    clearTimeout(this.timers[task]);
    delete this.autoRemoveEnabled[task];
    delete this.countdownMinutes[task];
    delete this.timers[task];
  }

}
