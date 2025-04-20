import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatistiquesComponent } from './statistiques/statistiques.component'; // ✅ chemin à adapter


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StatistiquesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'MSPR_Front';
}
