import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getActiveBrand().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.brand_color) {
          document.documentElement.style.setProperty('--brand-color', res.data.brand_color);
        }
      },
      error: (err) => console.error('Failed to fetch brand color', err)
    });
  }
}
