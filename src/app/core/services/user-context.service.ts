import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SessionService } from 'src/app/core/services/session.service';
import { UserInfo } from '../model/user-info';

const defaultUser: UserInfo = null;

@Injectable({
  providedIn: 'root',
})
export class UserContextService {
  public user$ = new BehaviorSubject(defaultUser);

  constructor(private sessionService: SessionService) {
    const data = this.sessionService.getItem('userInfo');
    if (data != null) {
      this.user$.next(data);
    }
  }

  public setUser(user: UserInfo) {
    let expirationDate = new Date(new Date().getTime() + 1 * 60 * 60 * 1000);
    this.sessionService.setItem('expirationDate', expirationDate);
    this.sessionService.setItem('userInfo', user);
    this.user$.next(user);
  }

  public getMenuUrlPermission(menuUrl: string): string[] {
    let permissions: string[] = [];
    if (this.user$.getValue()?.menuUrlPermissions) {
      let menuUrlPermission = this.user$
        .getValue()
        ?.menuUrlPermissions.filter((x) => x.menuUrl === menuUrl);
      menuUrlPermission.forEach((x) => {
        permissions.push.apply(
          permissions,
          x?.permissions.map((p) => p.permissionCode)
        );
      });
    }

    return permissions;
  }

  public getMenuUrlTitle(menuUrl: string): string {
    let title = '';
    let menus = this.sessionService.getItem('Menus');
    if (menus) {
      let menuItems = JSON.parse(menus);
      menuItems.forEach((menu) => {
        menu?.items?.forEach((item) => {
          if (item?.routerLink == menuUrl) {
            title = item.label;
          }
        });
      });
    }

    return title;
  }

  public logout() {
    console.log('logout');
    const lang = this.sessionService.getItem('LANG');
    this.sessionService.clear();
    this.sessionService.setItem('LANG', lang);
    this.user$.next(defaultUser);
  }
}

export class MenuUrlPermission {
  menuUrl: string;

  permissions: Permission[];
}

export class Permission {
  permissionId: string;

  parentId: string;

  permissionCode: string;

  permissionDesc: string;

  permissionDescEn: string;

  permissionUrl: string;

  ordinal: number;
}
