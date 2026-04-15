import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from '../models/Producto';
import { AuthService } from './auth-service';


export interface CartItem {
  producto: Producto;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarroService {

  private authService = inject(AuthService);

  private storageKey = 'carro_items_v1';
  private items: CartItem[] = [];
  private items$ = new BehaviorSubject<CartItem[]>([]);

  constructor() {
    this.loadFromStorage();
    
    this.authService.currentUser$.subscribe(user => {
    if (!user) {
      this.clear();
    }
  });
  }

  // Observable to watch cart changes
  watchItems(): Observable<CartItem[]> {
    return this.items$.asObservable();
  }

  // Return a shallow copy of items
  getItems(): CartItem[] {
    return this.items.slice();
  }

  getItem(productoId: number): CartItem | undefined {
    return this.items.find(i => i.producto.id === productoId);
  }

  addProduct(producto: Producto, cantidad = 1): void {
    const idx = this.items.findIndex(i => i.producto.id === producto.id);
    if (idx >= 0) {
      this.items[idx].cantidad += cantidad;
    } else {
      this.items.push({ producto, cantidad });
    }
    this.saveToStorage();
  }

  updateQuantity(productoId: number, cantidad: number): void {
    const idx = this.items.findIndex(i => i.producto.id === productoId);
    if (idx === -1) return;
    if (cantidad <= 0) {
      this.items.splice(idx, 1);
    } else {
      this.items[idx].cantidad = cantidad;
    }
    this.saveToStorage();
  }

  removeProduct(productoId: number): void {
    const idx = this.items.findIndex(i => i.producto.id === productoId);
    if (idx === -1) return;
    this.items.splice(idx, 1);
    this.saveToStorage();
  }

  clear(): void {
    this.items = [];
    this.saveToStorage();
  }

  getTotalItems(): number {
    return this.items.reduce((sum, it) => sum + it.cantidad, 0);
  }

  getTotalPrice(): number {
    return this.items.reduce((sum, it) => sum + it.cantidad * (it.producto.precio ?? 0), 0);
  }

  // Persistence
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {}
    this.items$.next(this.items.slice());
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.items = JSON.parse(raw) as CartItem[];
      } else {
        this.items = [];
      }
    } catch (e) {
      this.items = [];
    }
    this.items$.next(this.items.slice());
  }
}
