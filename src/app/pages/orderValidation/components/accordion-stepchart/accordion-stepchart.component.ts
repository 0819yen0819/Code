import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AccordionStepchartService } from './accordion-stepchart.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LanguageService } from 'src/app/core/services/language.service';

@Component({
  selector: 'app-accordion-stepchart',
  templateUrl: './accordion-stepchart.component.html',
  styleUrls: ['./accordion-stepchart.component.scss']
})
export class AccordionStepchartComponent implements OnChanges, OnDestroy {
  @Input() formTypeId: string;
  @Input() formNo: string;

  private onLangChange$: Subscription;

  isContentVisible: boolean;

  originChartData = []; // className 只有 done/active/inactive
  chartDataOfLang = []

  constructor(
    private accordionStepchartService: AccordionStepchartService,
    private translateService: TranslateService,
    private languageService: LanguageService
  ) {
    this.isContentVisible = window.innerWidth > 768; // 手機板預設摺疊
    this.onLangChange$ = this.translateService.onLangChange.subscribe((lang) => { this.getChartByLang(lang.lang); });
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (this.formTypeId && this.formNo) {
      this.originChartData = await this.accordionStepchartService.getProcessForecastingByLang(this.formTypeId, this.formNo);
      this.getChartByLang(this.languageService.getLang());
    }
  }

  getChartByLang(lang: string) {
    this.chartDataOfLang = [];
    this.originChartData.forEach(element => {
      this.chartDataOfLang.push({
        className: element.className,
        toolTips: lang === 'zh-tw' ? element.toolTipsCn : element.toolTipsEn,
        content: lang === 'zh-tw' ? element.contentCn : element.contentEn
      })
    });
  }

  ngOnDestroy(): void {
    this.onLangChange$?.unsubscribe();
  }

  toggleCollapsible() {
    this.isContentVisible = !this.isContentVisible;
  }

}
