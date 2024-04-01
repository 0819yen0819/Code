import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { UserContextService } from '../services/user-context.service';
import { SessionService } from '../services/session.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private msalService: MsalService,
    private userContextService: UserContextService,
    private sessionService: SessionService,
  ) {
  }

  canActivate(_router: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    let currentPath = state.url;
    console.log(currentPath);

    let expirationDate = this.sessionService.getItem('expirationDate');
    if (!expirationDate || new Date() > new Date(expirationDate)) {
      this.sessionService.clear();
      this.router.navigate(['/login']);
      return false;
    }

    const user = this.userContextService.user$.getValue();
    if (user == null || !user?.userCode ) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}

