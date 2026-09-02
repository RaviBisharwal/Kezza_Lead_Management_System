import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {

  email = '';
  password = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {

  const user =
    localStorage.getItem(
      'user'
    );

  if (user) {

    this.router.navigate(
      ['/dashboard']
    );
  }
}

  login() {

    const body = {

      email: this.email,
      password: this.password

    };

    this.http.post<any>(
      `${environment.apiUrl}/users/login`,
      body
    )
    .subscribe({

      next: (response) => {

        localStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );

        alert(
          'Login Successful'
        );

        this.router.navigate(
          ['/dashboard']
        );
      },

      error: (error) => {

        alert(
          error.error.message
        );
      }

    });
  }
}