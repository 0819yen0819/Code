import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { TableCol } from 'src/app/core/model/data-table-cols';
import {
  DataTableParams,
  DataTableSettings
} from 'src/app/core/model/data-table-view';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ECCNLERules, ShowECCNLERules } from '../../../core/model/eccn-info';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-ler',
  templateUrl: './ler.component.html',
  styleUrls: ['./ler.component.scss'],
})
export class LerComponent implements OnInit, OnDestroy {
  private unsubscribeEvent = new Subject();

  formType!: string;

  //> data table settings
  dataTableSettings!: DataTableParams;
  itemQueue!: BehaviorSubject<ShowECCNLERules[]>;
  itemTableCols!: BehaviorSubject<TableCol[]>;

  //> eccn le rule add dialog params
  amLERuleDialogParams!: DialogSettingParams;
  LERuleDialogMode!: string;
  selectedData!: ECCNLERules;

  permissions!: string[];

  constructor(
    private objectFormatService: ObjectFormatService,
    private translateService: TranslateService,
    private userContextService: UserContextService,
    private router: Router,
    private tableStatusKeepService: TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
    }
  }

  ngOnInit(): void {
    this.formType = FormTypeEnum.LEH_S;
    this.itemQueue = new BehaviorSubject<ShowECCNLERules[]>([]);
    this.itemTableCols = new BehaviorSubject<TableCol[]>([]);

    this.dataTableSettings = new DataTableSettings();
    this.dataTableSettings.isShowNoDataInfo = true;
    this.dataTableSettings.isAddMode = this.permissions.includes('add');
    this.dataTableSettings.isForceShowTable = true;
    //# TK-35854
    this.dataTableSettings.isPaginationMode = false;
    (this.dataTableSettings.isEditedMode = this.permissions.includes('edit')),
      (this.dataTableSettings.isScrollable = true);
    this.dataTableSettings.isFuzzySearchMode = true;
    this.dataTableSettings.isColSelectorMode = true;
    this.dataTableSettings.isSortMode = true;
    this.dataTableSettings.noDataConText = this.translateService.instant(
      'LicenseMgmt.Common.Hint.NoResult'
    );

    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        //# TK-35854
        this.onReRenderByLangChange();
        this.dataTableSettings.noDataConText = this.translateService.instant(
          'LicenseMgmt.Common.Hint.NoResult'
        );
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  onReRenderByLangChange(): void {
    const targetColTranslate: TableCol[] = this.translateService.instant(
      'LEHRuleManager.Columns'
    );

    const transCols: TableCol[] = new Array<TableCol>();

    //> 需要 fit col in table 在這設定
    const fittedCol: string[] = ['eccn', 'civ', 'gbs', 'enc', 'lvs', 'flag'];

    for (const showCol of this.itemTableCols.getValue()) {
      for (const transCol of targetColTranslate) {
        if (transCol.field == showCol.field) {
          showCol.label = transCol.label;
        }

        if (fittedCol.includes(showCol.field)) {
          showCol.isFittedCol = true;
        }

        transCols.push(showCol);
      }
    }
  }

  onSearchSecionsResult(result: ECCNLERules[]): void {
    if (result.length === 0) { 
      this.itemQueue.next([]);
      this.tableStatusKeepService.resetPageEvent();
      return;
    }
    this.tableStatusKeepService.resetPageEvent();
    this.itemQueue.next(new Array<ShowECCNLERules>());
    this.itemTableCols.next(new Array<TableCol>());

    //> eccn LE info list for show
    result.forEach((item) => {
      this.itemQueue.next([
        ...this.itemQueue.getValue(),
        {
          key: item.eccn,
          eccn: item.eccn,
          civ: item.civ == undefined || item.civ == 'N' ? null : item.civ,
          gbs: item.gbs == undefined || item.gbs == 'N' ? null : item.gbs,
          enc: item.enc == undefined || item.enc == 'N' ? null : item.enc,
          lvs: item.lvs == undefined || item.lvs == 'N' ? null : item.lvs,
          orderAmt: item.orderAmt == undefined ? null : item.orderAmt,
          yearAmt: item.yearAmt == undefined ? null : item.yearAmt,
          remark: item.remark == undefined ? null : item.remark,
          flag: item.flag,
          createdDate: this.objectFormatService.DateTimeFormat(
            item.createdDate, '/'
          ),
          createdBy: item.createdBy,
          lastUpdatedDate: this.objectFormatService.DateTimeFormat(
            item.lastUpdatedDate, '/'
          ),
          lastUpdatedBy: item.lastUpdatedBy,
        },
      ]);
    });

    //> based on itemQueue object key
    if (this.itemTableCols.getValue.length == 0) {
      Object.keys(this.itemQueue?.getValue()[0]).forEach((key) => {
        if (key != 'key') {
          this.itemTableCols.next([
            ...this.itemTableCols.getValue(),
            {
              label: key,
              field: key,
            },
          ]);
        }
      });
    }

    //# TK-35854
    if (this.itemQueue.getValue().length > 0) {
      this.dataTableSettings.isPaginationMode = true;
    }

    this.onReRenderByLangChange();
  }

  onOpenLEDialogToggle(status: boolean): void {
    if (status) {
      this.amLERuleDialogParams = {
        title: this.translateService.instant(
          'LEHRuleManager.Dialog.Header.Add'
        ),
        visiable: true,
      };
      this.LERuleDialogMode = 'add';
    }
  }

  onEditSelectedDataCallback(data: ECCNLERules) {
    this.amLERuleDialogParams = {
      title: this.translateService.instant(
        'LEHRuleManager.Dialog.Header.Modify'
      ),
      visiable: true,
    };
    this.LERuleDialogMode = 'edit';
    this.selectedData = data;
  }
}
