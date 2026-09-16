import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, Event as RouterEvent, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ApiService } from './core/services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isRouteLoading = signal<boolean>(false);

  constructor(private api: ApiService, private router: Router) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        this.isRouteLoading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isRouteLoading.set(false);
      }
    });
  }

  ngOnInit() {
    // Brand color is initialized globally by BrandService via APP_INITIALIZER
  }
}
