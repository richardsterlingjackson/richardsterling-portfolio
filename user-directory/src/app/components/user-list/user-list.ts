import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { UserService } from '../../services/user';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatCardModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserListComponent implements OnInit, OnChanges {
  @Input() reloadTrigger: number = 0;
  @Output() viewUser = new EventEmitter<any>();
  @Output() editUserEvent = new EventEmitter<any>(); // ✅ Added for editing

  users: any[] = [];
  displayedColumns: string[] = ['name', 'age', 'location', 'actions'];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reloadTrigger']) {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.userService.getUsers().subscribe((data: any) => {
      this.users = data;
    });
  }

  deleteUser(id: string) {
    this.userService.deleteUser(id).subscribe(() => {
      this.loadUsers();
    });
  }

  emitUser(user: any) {
    this.viewUser.emit(user);
  }

  editUser(user: any) {
    this.editUserEvent.emit(user); // ✅ Emits user to parent for editing
  }
}