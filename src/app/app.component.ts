import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatistiquesComponent } from './statistiques/statistiques.component'; // ✅ chemin à adapter
import { AcceuilComponent } from './Home/acceuil/acceuil.component';
import { HeaderComponent } from "./Header/header/header.component";
import { FooterComponent } from './Footer/footer/footer.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent,FooterComponent],
  standalone:true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'MSPR_Front';
}
