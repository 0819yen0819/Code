import { Injectable } from '@angular/core';
import { SessionService } from './session.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  languages: string[] = ['zh-tw', 'en-us'];

  constructor(
    private sessionService: SessionService,
    private translateService: TranslateService,
  ) { }

  public initLang() {
    this.translateService.addLangs(this.languages);
    this.translateService.setDefaultLang(this.languages[0]);

    let language = this.getLang();

    this.translateService.use(language);
    this.sessionService.setItem("LANG", language);
  }

  public getLangs() {
    return this.languages;
  }

  public getLang() {
    let language = this.sessionService.getItem("LANG");
    if (!this.languages.includes(language)) {
      console.log('browser language: ', navigator.language);
      if(navigator.language === 'zh-TW' || navigator.language === 'zh-CN'){
        language = 'zh-tw';
      }else{
        language = 'en-us';
      }
      // language = this.translateService.getDefaultLang();
    }
    return language;
  }

  public setLang(language: string) {
    if (this.languages.includes(language)) {
      this.translateService.use(language);
      this.sessionService.setItem("LANG", language);
    }
  }

  public getContent(content: string) {
    let result = content;
    try {
      let contentObject: LanguageContent = JSON.parse(content);
      let language = this.getLang();
      switch (language) {
        case 'zh-tw':
          result = contentObject.TW ? contentObject.TW : content;
          break;
        case 'en-us':
          result = contentObject.EN ? contentObject.EN : content;
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(error);
    }
    return result;
  }

  public translate(key: string, params?: Object) {
    return this.translateService.instant(key, params);
  }

}

class LanguageContent {
  TW: string;
  EN: string;
}
