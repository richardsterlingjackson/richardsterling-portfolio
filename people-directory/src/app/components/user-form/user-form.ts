import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user';
import { User } from '../../models/user.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss']
})
export class UserFormComponent implements OnChanges {
  @Input() userToEdit: User | null = null;
  @Output() userAdded = new EventEmitter<void>();
  @Output() userUpdated = new EventEmitter<void>();

  userForm: FormGroup;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      role: ['', Validators.required],
      tenure: [0, [Validators.required, Validators.min(0)]],
      avatarUrl: ['']
    });
  }

  ngOnChanges() {
    if (this.userToEdit) {
      this.userForm.patchValue(this.userToEdit);
    }
  }

  onSubmit() {
    const formData = this.userForm.value;

    if (this.userToEdit) {
      this.userService.updateUser(this.userToEdit._id!, formData).subscribe(() => {
        this.userForm.reset();
        this.userUpdated.emit();
      });
    } else {
      this.userService.addUser(formData).subscribe(() => {
        this.userForm.reset();
        this.userAdded.emit();
      });
    }
  }
}