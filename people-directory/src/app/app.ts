import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterBarComponent } from './components/filter-bar/filter-bar';
import { UserGridComponent } from './components/user-grid/user-grid';
import { UserFormComponent } from './components/user-form/user-form';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FilterBarComponent,
    UserGridComponent,
    UserFormComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  protected readonly title = signal('People Directory');
  selectedFilter = signal('All');
  editingUser = signal<User | null>(null);
  reloadUserList = signal(0);

  onFilterChange(filter: string) {
    this.selectedFilter.set(filter);
  }

  onUserAdded() {
    this.reloadUserList.update(n => n + 1);
  }

  onUserUpdated() {
    this.reloadUserList.update(n => n + 1);
    this.editingUser.set(null);
  }

  startEditingUser(user: User) {
    this.editingUser.set(user);
  }
}