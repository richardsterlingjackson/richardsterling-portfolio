import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // ✅ Added for <mat-icon>

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule // ✅ Enables <mat-icon> usage
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserFormComponent implements OnChanges {
  @Input() userToEdit: any | null = null; // ✅ Input for editing
  @Output() userAdded = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<void>(); // ✅ Output for update

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userToEdit'] && this.userToEdit) {
      this.userForm.patchValue(this.userToEdit); // ✅ Pre-fill form for editing
    }
  }

  onSubmit() {
    const formData = this.userForm.value;

    if (this.userToEdit) {
      this.userService.updateUser(this.userToEdit._id, formData).subscribe({
        next: () => {
          this.userForm.reset();
          this.userUpdated.emit(); // ✅ Notify parent of update
        },
        error: err => console.error('Update user failed:', err)
      });
    } else {
      this.userService.addUser(formData).subscribe({
        next: () => {
          this.userForm.reset();
          this.userAdded.emit(); // ✅ Notify parent of add
        },
        error: err => console.error('Add user failed:', err)
      });
    }
  }
}