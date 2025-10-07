import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import { User } from '../../models/user.model';
import { UserCardComponent } from '../user-card/user-card';

@Component({
  selector: 'app-user-grid',
  standalone: true,
  imports: [CommonModule, UserCardComponent],
  templateUrl: './user-grid.html',
  styleUrls: ['./user-grid.scss']
})
export class UserGridComponent implements OnChanges {
  @Input() filter: string = 'All';
  @Input() reloadTrigger: number = 0;
  @Output() editUserEvent = new EventEmitter<User>();

  users: User[] = [];

  constructor(private userService: UserService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filter'] || changes['reloadTrigger']) {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.userService.getUsers().subscribe(data => {
      this.users = this.filter === 'All'
        ? data
        : data.filter(user => user.location === this.filter);
    });
  }

  onEdit(user: User) {
    this.editUserEvent.emit(user);
  }
}