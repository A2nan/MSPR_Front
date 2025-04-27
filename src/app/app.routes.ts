import { Routes } from '@angular/router';
import { AcceuilComponent } from './Home/acceuil/acceuil.component';
import { StatistiquesComponent } from './statistiques/statistiques.component';
import { AProposComponent } from './A-propos/a-propos/a-propos.component';

export const routes: Routes = [
   { path: '', component: AcceuilComponent},
   { path:'accueil', component: AcceuilComponent},
   { path: 'tableau-de-bord', component: StatistiquesComponent},
   { path: 'a-propos', component: AProposComponent}
];
