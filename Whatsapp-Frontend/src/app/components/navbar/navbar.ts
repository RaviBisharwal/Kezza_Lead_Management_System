import {
  Component,
  OnInit,
  inject,
  PLATFORM_ID
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  Router,
  RouterModule
} from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule
  ],

  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})

export class NavbarComponent
implements OnInit {

  darkMode = false;

  showMenu = false;

  user: any = {};

  private platformId =
    inject(PLATFORM_ID);

  constructor(
    private router: Router
  ) {}

  ngOnInit() {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.user = JSON.parse(
        localStorage.getItem('user')
        || '{}'
      );

      this.darkMode =
        localStorage.getItem('theme')
        === 'dark';

      if (this.darkMode) {

        document.body.classList.add(
          'dark-mode'
        );
      }
    }
  }

  toggleTheme() {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) return;

    this.darkMode =
      !this.darkMode;

    if (this.darkMode) {

      document.body.classList.add(
        'dark-mode'
      );

      localStorage.setItem(
        'theme',
        'dark'
      );

    } else {

      document.body.classList.remove(
        'dark-mode'
      );

      localStorage.setItem(
        'theme',
        'light'
      );
    }
  }

  toggleMenu() {

    this.showMenu =
      !this.showMenu;
  }

  goToProfile() {

    this.showMenu = false;

    this.router.navigate([
      '/profile'
    ]);
  }

  logout() {

    this.showMenu = false;

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      localStorage.removeItem(
        'user'
      );
    }

    this.router.navigate([
      '/login'
    ]);
  }

  isRoute(
    route: string
  ): boolean {

    return this.router.url === route;
  }
}