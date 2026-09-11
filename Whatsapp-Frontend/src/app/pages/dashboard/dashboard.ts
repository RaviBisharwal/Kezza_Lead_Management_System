import {
  Component,
  OnInit,
  OnDestroy,
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
implements OnInit, OnDestroy {

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

  // QR loading state
  loadingQr = false;
  loadingElapsed = 0;
  loadingMessage = 'Starting WhatsApp...';

  private platformId = inject(PLATFORM_ID);
  private qrPollInterval: any = null;
  private loadingTimer: any = null;
  private wsReconnectTimer: any = null;

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

    if (this.isConnecting) return;

    this.isConnecting = true;
    this.loadingQr = true;
    this.qrCode = '';
    this.loadingElapsed = 0;
    this.loadingMessage = 'Starting WhatsApp...';
    this.startLoadingTimer();

    this.http.get<any>(
      `${environment.apiUrl}/whatsapp/connect/${this.userId}`
    )
    .subscribe({
      next: (response) => {
        console.log('SESSION CREATED:', response);
        this.sessionId = response.sessionId;

        if (response.status === 'connected') {
          this.status = 'connected';
          this.isConnecting = false;
          this.loadingQr = false;
          this.stopLoadingTimer();
          this.stopQrPolling();
        } else {
          this.status = 'Connecting...';
          // Start polling the QR endpoint as a fallback
          this.startQrPolling();
        }
      },
      error: (err) => {
        console.log(err);
        this.isConnecting = false;
        this.loadingQr = false;
        this.stopLoadingTimer();
        this.stopQrPolling();
        this.status = 'error';
        this.cdr.detectChanges();
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
        console.log('SESSION STATUS:', response);

        if (response.status && response.status !== 'not_found') {
          this.status = response.status;

          if (response.status === 'connected') {
            this.isConnecting = false;
          } else if (response.status === 'qr_pending') {
            // Session was already started, QR is waiting — poll for it
            this.isConnecting = true;
            this.loadingQr = true;
            this.startQrPolling();
            this.startLoadingTimer();
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  /** Poll GET /whatsapp/qr/:sessionId every 2s until we get a QR or connect */
  startQrPolling() {
    if (this.qrPollInterval) return;
    this.loadingMessage = 'Waiting for QR code...';

    this.qrPollInterval = setInterval(() => {
      this.http.get<any>(
        `${environment.apiUrl}/whatsapp/qr/${this.sessionId}`
      ).subscribe({
        next: (res) => {
          if (res.qr) {
            this.ngZone.run(() => {
              this.qrCode = res.qr;
              this.status = 'qr_pending';
              this.loadingQr = false;
              this.stopLoadingTimer();
              this.cdr.detectChanges();
            });
          }
        },
        error: () => {}
      });

      // Also check if session became connected
      this.http.get<any>(
        `${environment.apiUrl}/whatsapp/status/${this.sessionId}`
      ).subscribe({
        next: (res) => {
          if (res.status === 'connected') {
            this.ngZone.run(() => {
              this.status = 'connected';
              this.isConnecting = false;
              this.loadingQr = false;
              this.qrCode = '';
              this.stopQrPolling();
              this.stopLoadingTimer();
              this.loadStats();
              this.cdr.detectChanges();
            });
          }
        },
        error: () => {}
      });
    }, 2000);
  }

  stopQrPolling() {
    if (this.qrPollInterval) {
      clearInterval(this.qrPollInterval);
      this.qrPollInterval = null;
    }
  }

  /** Counts up seconds while Chrome is booting, shows friendly progress messages */
  startLoadingTimer() {
    this.stopLoadingTimer();
    this.loadingElapsed = 0;
    this.loadingTimer = setInterval(() => {
      this.loadingElapsed++;
      if (this.loadingElapsed < 5) {
        this.loadingMessage = 'Starting WhatsApp...';
      } else if (this.loadingElapsed < 12) {
        this.loadingMessage = 'Launching browser...';
      } else if (this.loadingElapsed < 22) {
        this.loadingMessage = 'Loading WhatsApp Web...';
      } else {
        this.loadingMessage = 'Almost ready, generating QR...';
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  stopLoadingTimer() {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
    }
  }

  openWebSocket() {

    if (!isPlatformBrowser(this.platformId)) return;

    this.ws = new WebSocket(environment.wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WS DATA:', data);

      this.ngZone.run(() => {

        if (this.sessionId && data.sessionId !== this.sessionId) return;

        if (data.qr) {
          this.qrCode = data.qr;
          this.status = 'qr_pending';
          this.loadingQr = false;
          this.stopLoadingTimer();
          this.stopQrPolling(); // WS delivered it — no need to keep polling
          this.cdr.detectChanges();
        }

        if (data.status) {
          this.status = data.status;

          if (data.status === 'connected') {
            this.isConnecting = false;
            this.loadingQr = false;
            this.qrCode = '';
            this.stopQrPolling();
            this.stopLoadingTimer();
            this.loadStats();
          }
          this.cdr.detectChanges();
        }
      });
    };

    this.ws.onerror = (err) => {
      console.log('WS ERROR:', err);
    };

    this.ws.onclose = () => {
      console.log('WebSocket Closed — reconnecting in 3s...');
      // Auto-reconnect so we never miss a QR event
      this.wsReconnectTimer = setTimeout(() => {
        this.openWebSocket();
      }, 3000);
    };
  }

  ngOnDestroy() {
    this.stopQrPolling();
    this.stopLoadingTimer();
    if (this.wsReconnectTimer) clearTimeout(this.wsReconnectTimer);
    if (this.ws) this.ws.close();
  }
}