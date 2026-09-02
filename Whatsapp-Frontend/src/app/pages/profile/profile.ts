import {
  Component,
  inject,
  PLATFORM_ID
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})

export class ProfileComponent {

  user: any = {};

subcategories: string[] = [];

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

  private platformId =
    inject(PLATFORM_ID);

  constructor(
    private http: HttpClient
  ) {}

  ngOnInit() {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.user = JSON.parse(
  localStorage.getItem('user') || '{}'
);

this.user.category ??= '';
this.user.subcategory ??= '';
this.user.centre ??= '';

this.subcategories =
  this.categoryOptions[this.user.category] || [];

this.user.subcategory =
  this.user.subcategory
    ? this.user.subcategory.split(',')
    : [];
    }
  }
  onCategoryChange() {

  this.subcategories =
    this.categoryOptions[this.user.category] || [];

  this.user.subcategory = [];

}
toggleSubcategory(
    subcategory: string,
    checked: boolean
) {

    if (checked) {

        if (!this.user.subcategory.includes(subcategory)) {

            this.user.subcategory.push(subcategory);

        }

    } else {

        this.user.subcategory =
            this.user.subcategory.filter(
                (s: string) => s !== subcategory
            );

    }

}
  updateProfile() {

    this.http.put(
  `${environment.apiUrl}/users/profile/${this.user.id}`,
  {

    category: this.user.category,
    subcategory: this.user.subcategory.join(','),
    centre: this.user.centre

  }
)
    .subscribe({

      next: () => {

        if (
          isPlatformBrowser(
            this.platformId
          )
        ) {

          localStorage.setItem(
            'user',
            JSON.stringify(this.user)
          );
        }

        alert(
          'Category updated successfully'
        );
      },

      error: (err) => {

        console.log(err);

        alert(
          'Failed to update category'
        );
      }
    });
  }
}