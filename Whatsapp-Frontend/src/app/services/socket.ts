import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  socket: Socket;

  constructor() {

    this.socket = io(
      environment.apiUrl
    );
  }

  joinRoom(userId: number) {

    this.socket.emit(
      'join_room',
      userId
    );
  }

  onQr(callback: any) {

    this.socket.on(
      'qr',
      callback
    );
  }

  onStatus(callback: any) {

    this.socket.on(
      'status',
      callback
    );
  }

  onMessage(callback: any) {

    this.socket.on(
      'new_message',
      callback
    );
  }
}