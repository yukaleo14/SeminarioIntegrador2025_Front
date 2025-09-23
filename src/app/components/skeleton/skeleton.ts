import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  imports: [],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss'
})
export class Skeleton {
  width = input.required<string>();
  height = input.required<string>();
  radius = input<string>();
}
