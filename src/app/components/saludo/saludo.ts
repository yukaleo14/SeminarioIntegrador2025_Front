import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, User } from '../../services/auth-service';

@Component({
  selector: 'app-saludo',
  imports: [],
  templateUrl: './saludo.html',
  styleUrl: './saludo.scss'
})
export class Saludo {
  private readonly currentTime = signal(new Date());
  private readonly _user = inject(AuthService);

  constructor() {
    effect(() => {
      const timer = setInterval(() => this.currentTime.set(new Date()), 60000);
      return () => clearInterval(timer);
    });
    this._user.getCurrentUserProfile().pipe(
      takeUntilDestroyed()
    )
      .subscribe({
        next: (user: User) => {
          this.usuario.set(user.getDataByRole()?.nombre || '');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al obtener el perfil del usuario:', err);
        }
      });
  }
  usuario = signal<string>('');
  saludo = computed(() => {
    const hour = this.currentTime().getHours();
    const nombre = this.usuario();
    let mensaje = 'Hola';
    if (hour >= 6 && hour < 12) {
      mensaje = 'Buenos días';
    } else if (hour < 19) {
      mensaje = 'Buenas tardes';
    } else {
      mensaje = 'Buenas noches';
    }
    return nombre ? `${mensaje}, ${nombre}` : mensaje;
  });

}
