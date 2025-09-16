import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFormComponent } from './components/user-form/user-form';
import { UserListComponent } from './components/user-list/user-list';
import { UserDetailComponent } from './components/user-detail/user-detail';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, UserFormComponent, UserListComponent, UserDetailComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('User Directory');
  selectedUser = signal<any | null>(null);
  editingUser = signal<any | null>(null); // ✅ Added for editing
  reloadUserList = signal(0);

  showUserDetails(user: any) {
    this.selectedUser.set(user);
  }

  clearUserDetails() {
    this.selectedUser.set(null);
  }

  onUserAdded() {
    this.reloadUserList.update(n => n + 1);
  }

  onUserUpdated() {
    this.reloadUserList.update(n => n + 1);
    this.editingUser.set(null); // ✅ Clear editing state after update
  }

  startEditingUser(user: any) {
    this.editingUser.set(user); // ✅ Set user to edit
  }
}