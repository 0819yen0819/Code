import { LoaderService } from './../../../../../core/services/loader.service';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { ResendInformerService } from 'src/app/core/services/resend-informer.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LicenseViewerHeaderService } from './license-viewer-header.service';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-common-license-viewer-header',
  templateUrl: './license-viewer-header.component.html',
  styleUrls: ['./license-viewer-header.component.scss'],
})
export class LicenseViewerHeaderComponent implements OnInit, OnDestroy {
  private unsubscribeEvent = new Subject();

  //> get license type from parent component
  @Input() formType!: string;
  @Output() outputResult: EventEmitter<any> = new EventEmitter<any>();

  formGroup!: FormGroup;

  //> license viewer title
  mainTitle!: string;

  //> boolean options
  boolOptions!: SelectItem<string>[];

  permissions!: string[];

  constructor(
    private loaderService: LoaderService,
    private formbuilder: FormBuilder,
    private objectFormatService: ObjectFormatService,
    private resendInformerService: ResendInformerService,
    private translateService: TranslateService,
    private userContextService: UserContextService,
    private router: Router,
    private licenseViewerHeaderService: LicenseViewerHeaderService,
    private tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({});

    //> 初始化下拉選單
    this.onInitDropdownOption();

    //> 初始化標題
    this.onInitLicenseViewHeaderByType();

    //> 啟動偵測重置事件
    this.onListenResendInformerStatusHandler();

    this.licenseViewerHeaderService.isReload
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((res) => {
        if (res) {
          this.onFormSubmit(true);
        }
      });

    //> 偵測當前語言變化
    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.onInitDropdownOption();
        this.onInitLicenseViewHeaderByType();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  onListenResendInformerStatusHandler(): void {
    this.resendInformerService
      .getResendInformerStatus()
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((res) => {
        if (res.status) {
          this.onInitLicenseViewHeaderByType(res.data);
        }
      });
  }

  onInitDropdownOption(): void {
    //> init boolean options
    this.boolOptions = [
      {
        label: this.translateService.instant(
          'DropDown.PlaceHolder.PleaseChoose'
        ),
        value: '',
      },
      {
        label: 'Y',
        value: 'Y',
      },
      { label: 'N', value: 'N' },
    ];
  }

  onInitLicenseViewHeaderByType(data: any = null): void {
    switch (this.formType) {
      case FormTypeEnum.LEH_S:
        this.onInitLEHView(data);
        break;

      case FormTypeEnum.ECCN_STATUS_MTN:
        this.onInitECCNStautsMtnView();
        break;

      default:
        this.mainTitle = `Not set up`;
        break;
    }

    this.resendInformerService.setResendInformerStatus(false);
  }

  //> on init LEH view header
  onInitLEHView(data: any = null): void {
    //> init license viewer title by license type
    this.mainTitle = `${FormTypeEnum.LEH_L}`;
    this.formGroup = this.formbuilder.group({
      eccn: [null],
      flag: [null],
    });

    if (data) {
      this.formGroup.get('eccn').setValue(data);
    }

    //# TK-35854
    //> 取得資料不帶入任何參數
    // this.getTargetECCNLERuleList();
  }

  //> on init ECCN Status MTN view header
  onInitECCNStautsMtnView(): void {
    this.mainTitle = this.translateService.instant(
      'LicenseMgmt.FormType.ECCNStatusMtn'
    );
    this.formGroup = this.formbuilder.group({
      eccn: [null],
      flag: [null],
    });
  }

  //> 條件重置
  onFormReset(): void {
    this.formGroup.reset();
    switch (this.formType) {
      case FormTypeEnum.LEH_S:
        //# TK-35854
        // this.getTargetECCNLERuleList();
        this.outputResult.emit([]);
        break;
      case FormTypeEnum.ECCN_STATUS_MTN:
        this.outputResult.emit([]);
        break;

      default:
        break;
    }
  }

  //> 條件篩選
  onFormSubmit(isReload = false): void {
    switch (this.formType) {
      case FormTypeEnum.LEH_S:
        this.getTargetECCNLERuleList();
        break;

      case FormTypeEnum.ECCN_STATUS_MTN: 
        if (!isReload){this.tableStatusKeepService.resetPageEvent();} // 手動點擊按鈕
        this.getTargetECCNList();
        break;

      default:
        break;
    }
  }

  //> 條件下載
  onFormDownload(): void {
    switch (this.formType) {
      case FormTypeEnum.LEH_S:
        this.downloadTargetECCNLERuleList();
        break;
      case FormTypeEnum.ECCN_STATUS_MTN:
        this.downloadTargetECCNList();
        break;
      default:
        break;
    }
  }

  //# ECCN LE Rules
  //> 取得符合條件的 ECCN LE Rules Event
  private getTargetECCNLERuleList(): void {
    this.loaderService.show();
    this.licenseViewerHeaderService
      .getTargetECCNLERuleList(
        this.objectFormatService.ObjectClean(this.formGroup.value)
      )
      .subscribe((res) => {
        this.loaderService.hide();
        this.outputResult.emit(res);
      });
  }

  //# ECCN LE Rules
  //> 下載符合條件的 ECCN LE Rules Event
  private downloadTargetECCNLERuleList(): void {
    this.licenseViewerHeaderService.downloadTargetECCNLERuleList(
      this.objectFormatService.ObjectClean(this.formGroup.value)
    );
  }

  //# ECCN Status Maintain
  //> 取得符合條件的 ECCN Status
  private getTargetECCNList(): void {
    this.loaderService.show();
    this.licenseViewerHeaderService
      .getTargetECCNList(
        this.objectFormatService.ObjectClean(this.formGroup.value)
      )
      .subscribe((res) => {
        this.loaderService.hide();
        this.outputResult.emit(res);
      });
  }

  //# ECCN Status Maintain
  //> 下載符合條件的 ECCN Status
  private downloadTargetECCNList(): void {
    this.licenseViewerHeaderService.downloadTargetECCNList(
      this.objectFormatService.ObjectClean(this.formGroup.value)
    );
  }
}
