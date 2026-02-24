import { Component } from '@angular/core';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  appTitle = 'ObraHub';

  constructor(private layout: LayoutService) {}

  toggleSidebar(): void {
    this.layout.toggle();
  }
}
