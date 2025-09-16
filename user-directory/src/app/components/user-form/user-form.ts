import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserFormComponent {
  @Output() userAdded = new EventEmitter<void>();
  userForm: FormGroup;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.userForm = this.fb.group({
      name: [''],
      age: [''],
      location: [''],
      favoriteMovie: [''],
      favoriteCar: [''],
      favoriteFood: [''],
      biography: ['']
    });
  }

  onSubmit() {
    this.userService.addUser(this.userForm.value).subscribe({
      next: () => {
        this.userForm.reset();
        this.userAdded.emit();
      },
      error: err => console.error('Add user failed:', err)
    });
  }
}