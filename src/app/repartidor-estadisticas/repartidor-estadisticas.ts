import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Header } from '../components/header/header';
import { Pedido, PedidoService } from '../services/pedido-service';
import { AuthService } from '../services/auth-service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatChip } from "@angular/material/chips";

@Component({
  selector: 'app-repartidor-estadisticas',
  standalone: true,
  imports: [
    Header,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatChip
],
  templateUrl: './repartidor-estadisticas.html',
  styleUrl: './repartidor-estadisticas.scss', // Puedes reutilizar los estilos de empresa
})
export class RepartidorEstadisticas implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartEstados') chartEstadosRef!: ElementRef;
  @ViewChild('chartDiario') chartDiarioRef!: ElementRef;

  private pedidoService = inject(PedidoService);

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(true);
  private readonly viewReady = signal(false);

  // KPIs adaptados al repartidor
  readonly totalPedidos = computed(() => this.pedidos().length);
  readonly pedidosEntregados = computed(
    () => this.pedidos().filter((p) => p.estado?.nombre === 'ENTREGADO').length
  );
  readonly pedidosEnCurso = computed(
    () => this.pedidos().filter(
        (p) => p.estado?.nombre === 'ASIGNADO' || p.estado?.nombre === 'ENRUTA' || p.estado?.nombre === 'EN RUTA'
      ).length
  );
  
  // Tabla de historial: Solo mostramos los últimos completados o en curso
  readonly historialPedidos = computed(() => 
    this.pedidos().sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
  );

  private readonly echartsInstances: echarts.ECharts[] = [];
  private readonly resizeHandler = () => this.echartsInstances.forEach((c) => c.resize());

  constructor() {
    effect(() => {
      if (!this.cargando() && this.viewReady()) {
        setTimeout(() => this.inicializarGraficos(), 0);
      }
    });
  }

  obtenerClaseEstado(nombreEstado: string | undefined): string {
    if (!nombreEstado) return '';
    // Convierte "EN RUTA" a "enruta", "ENTREGADO" a "entregado", etc.
    return nombreEstado.toLowerCase().replace(/\s+/g, '');
  }

  ngOnInit() {
    this.pedidoService.findMisPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los pedidos:', err);
        this.cargando.set(false);
      },
    });
  }

  ngAfterViewInit() {
    this.viewReady.set(true);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.echartsInstances.forEach((c) => c.dispose());
  }

  private inicializarGraficos() {
    this.initChartEstados();
    this.initChartDiario();
    window.addEventListener('resize', this.resizeHandler);
  }

  private makeChart(el: ElementRef): echarts.ECharts {
    const chart = echarts.init(el.nativeElement, null, { renderer: 'canvas' });
    this.echartsInstances.push(chart);
    return chart;
  }

  private initChartEstados() {
    if (!this.chartEstadosRef || this.pedidos().length === 0) return;
    const counts: Record<string, number> = {};
    for (const p of this.pedidos()) {
      const nombre = p.estado?.nombre ?? 'DESCONOCIDO';
      counts[nombre] = (counts[nombre] ?? 0) + 1;
    }
    
    const colorMap: Record<string, string> = {
      ASIGNADO: '#9b59b6',
      ENRUTA: '#1abc9c',
      'EN RUTA': '#1abc9c',
      ENTREGADO: '#2ecc71',
      CANCELADO: '#e74c3c',
    };

    const data = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      itemStyle: { color: colorMap[name] || '#95a5a6' },
    }));

    this.makeChart(this.chartEstadosRef).setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data,
        },
      ],
    });
  }

  private initChartDiario() {
    if (!this.chartDiarioRef || this.pedidos().length === 0) return;
    const counts: Record<string, number> = {};
    // Solo contamos los entregados para la métrica diaria de éxito
    for (const p of this.pedidos().filter(p => p.estado?.nombre === 'ENTREGADO')) {
      const day = new Date(p.fechaHora).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      });
      counts[day] = (counts[day] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);

    this.makeChart(this.chartDiarioRef).setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: sorted.map(([d]) => d), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: 'Entregados',
          type: 'bar',
          data: sorted.map(([, v]) => v),
          itemStyle: { color: '#2ecc71', borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { color: '#27ae60' } },
        },
      ],
    });
  }
}