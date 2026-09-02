import { Routes } from '@angular/router';

import { LoginComponent }
from './pages/login/login';

import { RegisterComponent }
from './pages/register/register';

import { DashboardComponent }
from './pages/dashboard/dashboard';

import { ContactsComponent }
from './pages/contacts/contacts';

import { ProfileComponent } 
from './pages/profile/profile';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'register',
    component: RegisterComponent
  },

  {
    path: 'dashboard',
    component: DashboardComponent
  },

  {
    path: 'contacts',
    component: ContactsComponent
  },
  {
  path:'profile',
  component: ProfileComponent
 }
];