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
import { RouterLink } from '@angular/router';
import { Header } from '../components/header/header';
import { Pedido, PedidoService } from '../services/pedido-service';

@Component({
  selector: 'app-empresa-estadisticas',
  standalone: true,
  imports: [Header, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './empresa-estadisticas.html',
  styleUrl: './empresa-estadisticas.scss',
})
export class EmpresaEstadisticas implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartEstados') chartEstadosRef!: ElementRef;
  @ViewChild('chartDiario') chartDiarioRef!: ElementRef;
  @ViewChild('chartIngresos') chartIngresosRef!: ElementRef;
  @ViewChild('chartProductos') chartProductosRef!: ElementRef;

  private pedidoService = inject(PedidoService);

  readonly pedidos = signal<Pedido[]>([]);
  readonly cargando = signal(true);
  private readonly viewReady = signal(false);

  readonly totalPedidos = computed(() => this.pedidos().length);
  readonly totalIngresos = computed(() =>
    this.pedidos()
      .filter((p) => p.estado?.nombre !== 'CANCELADO')
      .reduce((sum, p) => sum + (p.montoTotal ?? 0), 0)
  );
  readonly pedidosPendientes = computed(
    () =>
      this.pedidos().filter(
        (p) => p.estado?.nombre === 'CREADO' || p.estado?.nombre === 'ENPREPARACION'
      ).length
  );
  readonly pedidosEntregados = computed(
    () => this.pedidos().filter((p) => p.estado?.nombre === 'ENTREGADO').length
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

  ngOnInit() {
    this.pedidoService.getPedidosDeMiEmpresa().subscribe({
      next: (pedidos) => {
        this.pedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
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
    this.initChartIngresos();
    this.initChartProductos();
    window.addEventListener('resize', this.resizeHandler);
  }

  private makeChart(el: ElementRef): echarts.ECharts {
    const chart = echarts.init(el.nativeElement, null, { renderer: 'canvas' });
    this.echartsInstances.push(chart);
    return chart;
  }

  private initChartEstados() {
    if (!this.chartEstadosRef) return;
    const counts: Record<string, number> = {};
    for (const p of this.pedidos()) {
      const nombre = p.estado?.nombre ?? 'DESCONOCIDO';
      counts[nombre] = (counts[nombre] ?? 0) + 1;
    }
    const colorMap: Record<string, string> = {
      CREADO: '#3498db',
      ENPREPARACION: '#f39c12',
      ASIGNADO: '#9b59b6',
      ENRUTA: '#1abc9c',
      ENTREGADO: '#2ecc71',
      CANCELADO: '#e74c3c',
      DEMORADO: '#e67e22',
      PENDIENTE: '#95a5a6',
    };
    const data = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      itemStyle: { color: colorMap[name] },
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
    if (!this.chartDiarioRef) return;
    const counts: Record<string, number> = {};
    for (const p of this.pedidos()) {
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
          name: 'Pedidos',
          type: 'bar',
          data: sorted.map(([, v]) => v),
          itemStyle: { color: '#3498db', borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { color: '#2980b9' } },
        },
      ],
    });
  }

  private initChartIngresos() {
    if (!this.chartIngresosRef) return;
    const sums: Record<string, number> = {};
    for (const p of this.pedidos().filter((p) => p.estado?.nombre !== 'CANCELADO')) {
      const day = new Date(p.fechaHora).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
      });
      sums[day] = (sums[day] ?? 0) + (p.montoTotal ?? 0);
    }
    const sorted = Object.entries(sums).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);

    this.makeChart(this.chartIngresosRef).setOption({
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => `$${(v / 100).toFixed(2)}` },
      grid: { left: 70, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: sorted.map(([d]) => d), axisLabel: { rotate: 30 } },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `$${(v / 100).toFixed(0)}` } },
      series: [
        {
          name: 'Ingresos',
          type: 'line',
          smooth: true,
          data: sorted.map(([, v]) => v),
          lineStyle: { color: '#2ecc71', width: 3 },
          itemStyle: { color: '#2ecc71' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(46,204,113,0.3)' },
                { offset: 1, color: 'rgba(46,204,113,0.02)' },
              ],
            },
          },
        },
      ],
    });
  }

  private initChartProductos() {
    if (!this.chartProductosRef) return;
    const counts: Record<string, number> = {};
    for (const p of this.pedidos()) {
      for (const d of p.detalle ?? []) {
        const key = `Producto #${d.productoId}`;
        counts[key] = (counts[key] ?? 0) + d.cantidad;
      }
    }
    const top10 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    this.makeChart(this.chartProductosRef).setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 100, right: 20, top: 10, bottom: 20 },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: { type: 'category', data: top10.map(([k]) => k).reverse() },
      series: [
        {
          type: 'bar',
          data: top10.map(([, v]) => v).reverse(),
          itemStyle: { color: '#9b59b6', borderRadius: [0, 4, 4, 0] },
        },
      ],
    });
  }
}
