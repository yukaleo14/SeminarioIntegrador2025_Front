import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, tap } from 'rxjs';

@Component({
  selector: 'app-saludo',
  imports: [],
  templateUrl: './saludo.html',
  styleUrl: './saludo.scss'
})
export class Saludo {
  private readonly currentTime = signal(new Date());

  private readonly currentTimeRefresherSubscription = interval(60000)
    .pipe(
      takeUntilDestroyed(),
      tap(() => this.currentTime.set(new Date()))
    )
    .subscribe();
  // TODO: Obtener nombre del usuario mediante service
  usuario = signal<string>('Martín');
  saludo = computed(() => {
    const hour = this.currentTime().getHours();
    let mensaje = 'Hola';
    if (hour < 12 && hour >5) {
      mensaje = 'Buenos días';
    } else if (hour < 19) {
      mensaje = 'Buenas tardes';
    } else {
      mensaje = 'Buenas noches';
    }
    return mensaje;
  });
}
