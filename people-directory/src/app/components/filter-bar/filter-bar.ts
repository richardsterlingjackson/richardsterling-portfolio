import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './filter-bar.html',
  styleUrls: ['./filter-bar.scss']
})
export class FilterBarComponent {
  @Output() filterSelected = new EventEmitter<string>();

  filters = ['All', 'San Francisco', 'Nashville', 'Sydney'];

  selectFilter(filter: string) {
    this.filterSelected.emit(filter);
  }
}