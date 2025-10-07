import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './user-card.html',
  styleUrls: ['./user-card.scss']
})
export class UserCardComponent {
  @Input() user!: User;
}