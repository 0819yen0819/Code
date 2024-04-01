import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, take, takeUntil } from 'rxjs';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { DataTableParams } from 'src/app/core/model/data-table-view';
import { ECCNStatus } from 'src/app/core/model/eccn-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { ObjectFormatService } from './../../../core/services/object-format.service';
import { LicenseViewerHeaderService } from './../components/common/license-viewer-header/license-viewer-header.service';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-eccn-status-mtn',
  templateUrl: './eccn-status-mtn.component.html',
  styleUrls: ['./eccn-status-mtn.component.scss'],
})
export class EccnStatusMtnComponent implements OnInit, OnDestroy {
  private unSubscribeEvent = new Subject();

  formType!: string;

  dataTableSettings!: DataTableParams;
  tableMode!: string;
  itemCols!: TableCol[];

  //> init eccn list
  ECCNList: ECCNStatus[] = new Array<ECCNStatus>();

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  isUpdateSuccess!: boolean;

  constructor(
    private translateService: TranslateService,
    private objectFormatService: ObjectFormatService,
    private licenseViewerHeaderService: LicenseViewerHeaderService,
    private licenseControlApiService: LicenseControlApiService,
    private loaderService: LoaderService,
    private tableStatusKeepService : TableStatusKeepService
  ) {}

  ngOnInit(): void {
    //> 指定該元件類型
    this.formType = FormTypeEnum.ECCN_STATUS_MTN;

    this.tableMode = 'View';

    this.onInitTableCols();

    //> 監聽 user lang change
    this.translateService.onLangChange
      .pipe(takeUntil(this.unSubscribeEvent))
      .subscribe(() => {
        this.onInitTableCols();
      });
  }

  ngOnDestroy(): void {
    this.unSubscribeEvent.next(null);
    this.unSubscribeEvent.complete();
  }

  onInitTableCols(): void {
    //> 取得 i18n Table header col
    this.itemCols = this.translateService.instant(
      'ECCNStatusMTNManager.Columns'
    );

    //> 新增 fitting col
    for (const col of this.itemCols.filter(
      (data) => data.field === 'activeFlag'
    )) {
      col.isFittedCol = true;
    }
  }

  //> set filter data from common component of license view header
  onSearchSecionsResult(result: ECCNStatus[]): void {
    for (const eccnStatusInfo of result) {
      eccnStatusInfo.createdDate = this.objectFormatService.DateTimeFormat(
        new Date(eccnStatusInfo.createdDate),'/'
      );
      eccnStatusInfo.lastUpdatedDate = this.objectFormatService.DateTimeFormat(
        new Date(eccnStatusInfo.lastUpdatedDate),'/'
      );
    }
    this.tableMode = 'View';
    this.ECCNList = result;
    this.licenseViewerHeaderService.setReloadNotice(false);
  }

  onModifySelectedData(selectedData: ECCNStatus[]): void {
    this.tableMode = 'Edit';
    this.ECCNList = selectedData;
  }

  onCloseNoticeHandler(): void {
    if (this.isUpdateSuccess) {
      this.licenseViewerHeaderService.setReloadNotice(true);
    }
  }

  onSubmitModifySelectedData(modifyData: ECCNStatus[]): void {
    const eccnList = modifyData.map((data) => data.eccn);
    const activeFlag = modifyData[0].activeFlag;

    this.loaderService.show();

    this.licenseControlApiService
      .updateECCNStatus(activeFlag, eccnList)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isUpdateSuccess = true;
          this.loaderService.hide();
          this.noticeContentList = [
            `${this.translateService.instant('Common.Toast.SuccessUpdate')}`,
          ];
          this.noticeCheckDialogParams = {
            title: this.translateService.instant(
              'LicenseMgmt.Common.Title.Notification'
            ),
            visiable: true,
            mode: 'success',
          };
        },
        error: (err) => {
          this.isUpdateSuccess = false;
          console.error(err);
          this.loaderService.hide();
          this.noticeContentList = [err.error.message];
          this.noticeCheckDialogParams = {
            title: this.translateService.instant(
              'LicenseMgmt.Common.Title.Notification'
            ),
            visiable: true,
            mode: 'error',
          };
        },
      });
  }

  onNoticeCloseHandler(): void {
    this.licenseViewerHeaderService.setReloadNotice(true);
  }
}
