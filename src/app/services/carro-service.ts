import { inject, Injectable, signal } from '@angular/core';
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
  readonly itemsSignal = signal<CartItem[]>([]);

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
    console.log(this.items);
    
    return this.items$.asObservable();
  }

  // Return a shallow copy of items
  getItems(): CartItem[] {
    return [...this.items];
  }

  getItem(productoId: number): CartItem | undefined {
    return this.items.find(i => i.producto.id === productoId);
  }

  addProduct(producto: Producto, cantidad = 1): void {
    if (cantidad === 0) return;

    const currentItems = [...this.items];
    const idx = currentItems.findIndex(i => i.producto.id === producto.id);

    if (idx >= 0) {
      const nuevaCantidad = currentItems[idx].cantidad + cantidad;
      if (nuevaCantidad <= 0) {
        currentItems.splice(idx, 1);
      } else {
        currentItems[idx] = {
          ...currentItems[idx],
          cantidad: nuevaCantidad
        };
      }
    } else if (cantidad > 0) {
      currentItems.push({ producto: { ...producto }, cantidad });
    }
    this.items = currentItems;
    this.saveToStorage();
  }

  updateQuantity(productoId: number, cantidad: number): void {
    const currentItems = [...this.items];
    const idx = currentItems.findIndex(i => i.producto.id === productoId);
    if (idx === -1) return;
    if (cantidad <= 0) {
      currentItems.splice(idx, 1);
    } else {
      currentItems[idx].cantidad = cantidad;
    }
    this.items = currentItems;
    this.saveToStorage();
  }

  removeProduct(productoId: number): void {
    const idx = this.items.findIndex(i => i.producto.id === productoId);
    const currentItems = this.items.filter(i => i.producto.id !== productoId);
    this.items = currentItems;
    this.saveToStorage();
  }

  clear(): void {
    this.items = [];
    this.saveToStorage();
  }

  getTotalItems(): number {
    return this.itemsSignal().reduce((sum, it) => sum + it.cantidad, 0);
  }

  getTotalPrice(): number {
    return this.items.reduce((sum, it) => sum + it.cantidad * (it.producto.precio ?? 0), 0);
  }

  getCurrentSucursalId(): number | null {
    return this.items[0]?.producto.sucursalId ?? null;
  }

  // Persistence
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {}
    const snapshot = [...this.items];
    this.items$.next(snapshot);
    this.itemsSignal.set(snapshot);
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
    const snapshot = [...this.items];
    this.items$.next(snapshot);
    this.itemsSignal.set(snapshot);
  }
}
