import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NavbarComponent } from './layout/navbar.component';
import { SidebarComponent } from './layout/sidebar.component';
import { FooterComponent } from './layout/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ObraHub';
  showLayout = true;
  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // initial value based on current url (handles direct load)
    this.showLayout = !this.router.url.startsWith('/login');

    this.sub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      // hide navbar/sidebar on login route (and its children)
      this.showLayout = !e.urlAfterRedirects.startsWith('/login');
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
