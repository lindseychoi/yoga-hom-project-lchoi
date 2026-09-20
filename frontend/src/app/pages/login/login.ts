import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule],
  template: `
    <img class="background" src="landing-page.png" alt="" />
    <h1 class="wordmark">YOGA<br />HOM</h1>
    @if (!showForm()) {
      <button mat-button type="button" class="toggle" (click)="showForm.set(true)">Log in</button>
    }

    @if (showForm()) {
      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <button mat-icon-button type="button" class="close" aria-label="Close" (click)="showForm.set(false)">
          <mat-icon>close</mat-icon>
        </button>
        <h2>Welcome back</h2>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
        </mat-form-field>
        @if (error()) {
          <mat-error>{{ error() }}</mat-error>
        }
        <button mat-flat-button type="submit" [disabled]="form.invalid">Log in</button>
      </form>
    }

    <p class="tagline">Come as you are. Leave lighter.</p>
  `,
  styles: `
    @use '../../../styles/variables' as vars;

    :host {
      display: block;
      position: relative;
      min-height: 100vh;
      overflow: hidden;
    }

    .background {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .wordmark {
      position: absolute;
      top: 2rem;
      left: 2rem;
      margin: 0;
      font-family: vars.$font-sans;
      font-size: 5rem;
      font-weight: 500;
      line-height: 0.9;
      color: rgb(255 255 255 / 0.4);
    }

    .toggle {
      position: absolute;
      top: 2rem;
      right: 2rem;
      --mat-button-text-label-text-font: #{vars.$font-script};
      --mat-button-text-label-text-size: 2rem;
      --mat-button-text-label-text-color: white;
      --mat-button-text-state-layer-color: white;
    }

    .card {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: min(90vw, 400px);
      padding: 2rem;
      box-sizing: border-box;
      border-radius: 2rem;
      background: rgb(255 255 255 / 0.7);
      backdrop-filter: blur(12px);
      color: vars.$color-indigo;
    }

    .close {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }

    input:-webkit-autofill {
      transition: background-color 5000s ease-in-out 0s;
      -webkit-text-fill-color: vars.$color-ink;
    }

    h2 {
      margin: 0;
      font-family: vars.$font-sans;
      font-weight: 300;
    }

    .card button[type='submit'] {
      --mat-button-filled-label-text-font: #{vars.$font-script};
      --mat-button-filled-label-text-size: 1.5rem;
    }

    .tagline {
      position: absolute;
      right: 2rem;
      bottom: 2rem;
      margin: 0;
      font-family: vars.$font-script;
      font-size: 2.5rem;
      color: white;
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showForm = signal(false);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly error = signal<string | null>(null);

  protected submit() {
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => this.error.set(err.error?.message ?? err.message),
    });
  }
}
