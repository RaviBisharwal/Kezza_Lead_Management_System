import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef,
  inject,
  PLATFORM_ID
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    QRCodeComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class DashboardComponent
implements OnInit {

  userId!: number;

  userName = '';
  userEmail = '';

  sessionId = '';
  qrCode = '';
  status = '';

  ws!: WebSocket;

  isConnecting = false;
  totalContacts = 0;
  totalMessages = 0;

  private platformId =
    inject(PLATFORM_ID);

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }

    const user = JSON.parse(
      localStorage.getItem('user')
      || '{}'
    );

    if (!user.id) {

      alert('Please login first');

      window.location.href = '/login';

      return;
    }

    this.userId = user.id;
    this.userName = user.name;
    this.userEmail = user.email;

    this.sessionId =
      'session_' + this.userId;

    this.checkExistingSession();
    this.openWebSocket();
    this.loadStats();
  }

  logout() {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      localStorage.removeItem(
        'user'
      );

      window.location.href =
        '/login';
    }
  }

  connectWhatsapp() {

    if (this.isConnecting)
      return;

    this.isConnecting = true;

    this.http.get<any>(
      `${environment.apiUrl}/whatsapp/connect/${this.userId}`
    )
    .subscribe({

      next: (response) => {

        console.log(
          'SESSION CREATED:',
          response
        );

        this.sessionId =
          response.sessionId;

        this.status =
          response.status ||
          'Connecting...';

        if (response.status) {

          this.isConnecting =
            false;
        }
      },

      error: (err) => {

        console.log(err);

        this.isConnecting =
          false;
      }
    });
  }

  loadStats() {

    this.http.get<any>(
      `${environment.apiUrl}/whatsapp/stats/${this.userId}`
    )
    .subscribe(data => {

      this.totalContacts =
        data.totalContacts;

      this.totalMessages =
        data.totalMessages;

      console.log(
        'STATS:',
        data
      );
    });
  }

  checkExistingSession() {

    this.http.get<any>(
      `${environment.apiUrl}/whatsapp/status/${this.sessionId}`
    )
    .subscribe({

      next: (response) => {

        console.log(
          'SESSION STATUS:',
          response
        );

        if (
          response.status &&
          response.status !== 'not_found'
        ) {

          this.status =
            response.status;

          if (
            response.status ===
            'connected'
          ) {

            this.isConnecting =
              false;
          }
        }
      }
    });
  }

  openWebSocket() {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return;
    }

    this.ws = new WebSocket(
      environment.wsUrl
    );

    this.ws.onopen = () => {

      console.log(
        'WebSocket Connected'
      );
    };

    this.ws.onmessage =
      (event) => {

      const data =
        JSON.parse(event.data);

      console.log(
        'WS DATA:',
        data
      );

      this.ngZone.run(() => {

        if (
          this.sessionId &&
          data.sessionId !==
          this.sessionId
        ) {
          return;
        }

        if (data.qr) {

          this.qrCode =
            data.qr;

          this.status =
            'Scan QR Code';

          this.cdr.detectChanges();
        }

        if (data.status) {

          this.status =
            data.status;

          if (
            data.status ===
            'connected'
          ) {

            this.isConnecting =
              false;
          }

          this.cdr.detectChanges();
        }
      });
    };

    this.ws.onerror = err => {

      console.log(
        'WS ERROR:',
        err
      );
    };

    this.ws.onclose = () => {

      console.log(
        'WebSocket Closed'
      );
    };
  }
}