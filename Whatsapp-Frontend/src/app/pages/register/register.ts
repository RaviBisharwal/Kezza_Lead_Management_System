import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ CommonModule,FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  name = '';
  email = '';
  password = '';
  category = '';
  subcategories: string[] = [];
  selectedSubcategories: string[] = [];
  centre = '';
  categoryOptions: any = {

  hair: [
    'Hair_Transplant',
    'Hair_Transplant_New',
    'HT_Sikar',
    'HT_Kaurali',
    'HT_Sahapura',
    'HT_Jobner',
    'HT_Bundi_Kota_Chittor',
    'HT_Tonk',
    'Hair_Wig',
    'PRP_GFC_Exosome',
    'White Hair Extraction',
    'Beard_Transplant',
    'Eyebrow_Transplant'
  ],

  skin: [
    'Skin_Glow',
    'MediFacial',
    'Dark Circle',
    'Face PRP',
    'Glutathione',
    'Stretch Marks',
    'AcneScars',
    'Laser_Hair_Reduction',
    'Anti_Aging_Treatment',
    'Botox',
    'Fillers',
    'HIFU',
    'Cosmetic_Gynecology'
  ],

  PMU: [
    'Lip_Neutralization',
    'Eyebrow_Microblading',
    'Scalp_Micropigmentation_SMP',
    'Eye_Lashes'
  ],

  weight_loss: [
    'Weight_Loss Jaipur',
    'Weight_Loss_Sikar'
  ]

};

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  onCategoryChange() {

  this.selectedSubcategories = [];

  this.subcategories =
    this.categoryOptions[this.category] || [];

}
toggleSubcategory(
  subcategory: string,
  checked: boolean
) {

  if (checked) {

    if (
      !this.selectedSubcategories.includes(subcategory)
    ) {

      this.selectedSubcategories.push(
        subcategory
      );

    }

  } else {

    this.selectedSubcategories =
      this.selectedSubcategories.filter(
        s => s !== subcategory
      );

  }

}
  register() {

    const body = {

      name: this.name,
      email: this.email,
      password: this.password,
      category: this.category,
      subcategory: this.selectedSubcategories.join(','),
      centre: this.centre

    };

    this.http.post<any>(
      `${environment.apiUrl}/users/register`,
      body
    )
    .subscribe({

      next: (response) => {

        alert(response.message);

        this.router.navigate(
          ['/login']
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