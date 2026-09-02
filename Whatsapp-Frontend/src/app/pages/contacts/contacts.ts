import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule }
from '@angular/common';

import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css'
})
export class ContactsComponent
implements OnInit {

  contacts: any[] = [];

  userId = 0;
  searchText = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {

    const userString =
  localStorage.getItem('user');

console.log(
  'LOCAL STORAGE USER:',
  userString
);

const user =
  JSON.parse(
    userString || '{}'
  );

this.userId =
  user.id;

console.log(
  'USER ID:',
  this.userId
);

    /*
     * Delay loading slightly
     * to avoid NG0100 error
     */
    setTimeout(() => {

      this.loadContacts();

    }, 0);
  }

  filteredContacts() {

  return this.contacts.filter(c =>

    c.name?.toLowerCase()
    .includes(
      this.searchText.toLowerCase()
    )

    ||

    c.phone?.includes(
      this.searchText
    )

  );
}

  loadContacts() {

  this.http.get<any[]>(
    `${environment.apiUrl}/whatsapp/contacts/${this.userId}`
  )
  .subscribe(data => {

    console.log("CONTACTS:", data);

    this.ngZone.run(() => {

      this.contacts = data;

      console.log(
        "CONTACTS LENGTH:",
        this.contacts.length
      );

      this.cdr.detectChanges();
    });
  });
}
}