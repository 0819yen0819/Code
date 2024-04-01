import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Observable, takeLast } from 'rxjs';
import {
  AUECCNLERules,
  ECCNInfo,
  ECCNLERules,
} from 'src/app/core/model/eccn-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { LanguageService } from 'src/app/core/services/language.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { ResendInformerService } from 'src/app/core/services/resend-informer.service';

@Component({
  selector: 'app-add-modify-le-rule-dialog',
  templateUrl: './am-le-rule-dialog.component.html',
  styleUrls: ['./am-le-rule-dialog.component.scss'],
})
export class AMLERuleDialogComponent implements OnInit, OnChanges {
  @Input() settingParams!: DialogSettingParams;
  @Input() mode!: string;
  @Input() selectedData!: ECCNLERules;

  //> self dialog settings
  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  //> eccn list
  eccnListOptions!: BehaviorSubject<SelectItem<ECCNInfo['eccn']>[]>;

  //> boolean options
  boolOptions!: SelectItem<string>[];

  //> boolean options
  boolAndNullOptions!: SelectItem<string | null>[];

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  eccn!: string;
  flag!: string;
  civ!: string;
  gbs!: string;
  enc!: string;
  lvs!: string;
  orderAmt!: number | null;
  yearAmt!: number | null;
  remark!: string | null;

  constructor(
    private licenseControlApiService: LicenseControlApiService,
    private objectFormatService: ObjectFormatService,
    private resendInformerService: ResendInformerService,
    private translateService: TranslateService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    //> init dialog setting
    this.dialogSetting = new BehaviorSubject<DialogSettingParams>({
      title: '',
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });

    //> init boolean options
    this.boolOptions = [
      {
        label: 'Y',
        value: 'Y',
      },
      { label: 'N', value: 'N' },
    ];

    this.onInitLEHView();
    this.onInitFormValue();
  }

  ngOnChanges(): void {
    this.onInitFormValue();

    //> when any changes, reset dialog setting params
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });
    }

    //> when any changes, update form value by mode
    if (this.mode == 'edit') {
      this.eccn = this.selectedData.eccn;
      this.flag = this.selectedData.flag;
      this.civ = this.selectedData.civ == null ? 'N' : this.selectedData.civ;
      this.gbs = this.selectedData.gbs == null ? 'N' : this.selectedData.gbs;
      this.enc = this.selectedData.enc == null ? 'N' : this.selectedData.enc;
      this.lvs = this.selectedData.lvs == null ? 'N' : this.selectedData.lvs;
      this.orderAmt = this.selectedData.orderAmt;
      this.yearAmt = this.selectedData.yearAmt;
      this.remark =
        this.selectedData.remark == null ? '' : this.selectedData.remark;
    }
  }

  //> on dialog close event
  onDialogClosed(): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });

    this.onInitFormValue();
  }

  //> on form submit event
  onFormSubmit(): void {
    //> init form values
    let formValue: any = {
      eccn: this.eccn,
      flag: this.flag,
      civ: this.civ,
      gbs: this.gbs,
      enc: this.enc,
      lvs: this.lvs,
      orderAmt: this.orderAmt,
      yearAmt: this.yearAmt,
      remark: this.remark,
    };

    //> init postive real decimal regexp
    const posRealDecimal = new RegExp(
      /^(([1-9]{1}[0-9]{1,}|[0-9]{1}).[0-9]{0,}[1-9]{1}|(([1-9]{1}[0-9]{1,}|[0-9]{1})|([1-9]{1}[0-9]{1,}|[1-9]{1}).0))$/
    );

    //> init error list
    this.noticeContentList = new Array<string>();

    //> error message rule
    if (formValue.eccn == null) {
      this.noticeContentList.push(
        `${this.translateService.instant(
          'Common.Dialog.Message.PlzChoose'
        )} ECCN`
      );
    }

    if (formValue.remark != null && formValue.remark.length > 300) {
      this.noticeContentList.push(
        `Remark ${this.translateService.instant(
          'Common.Dialog.Message.Upto300'
        )}`
      );
    }

    if (formValue.lvs == 'Y') {
      if (!formValue.orderAmt) {
        this.noticeContentList.push(
          `${this.translateService.instant(
            'Common.Dialog.Message.PlzKeyIn'
          )} LVS AMT (Single Order_USD)`
        );
      }
      if (!formValue.yearAmt) {
        this.noticeContentList.push(
          `${this.translateService.instant(
            'Common.Dialog.Message.PlzKeyIn'
          )} LVS LimitAMT (YearItem Cust/End Cust_USD)`
        );
      }

      if (
        formValue.orderAmt &&
        !posRealDecimal.test(formValue.orderAmt.toString())
      ) {
        this.noticeContentList.push(
          `LVS AMT ${this.translateService.instant(
            'Common.Dialog.Message.OnlyPosDecimal'
          )}`
        );
      }

      if (
        formValue.yearAmt &&
        !posRealDecimal.test(formValue.yearAmt.toString())
      ) {
        this.noticeContentList.push(
          `LVS LimitAMT ${this.translateService.instant(
            'Common.Dialog.Message.OnlyPosDecimal'
          )}`
        );
      }
    }

    //> open notice check dialog
    if (this.noticeContentList.length > 0) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant('Common.Dialog.Header.Notice'),
        visiable: true,
      };
    } else {
      const auECCNLERule$ = (req: AUECCNLERules): Observable<boolean> =>
        new Observable<any>((obs) => {
          this.licenseControlApiService
            .auECCNLERule(req)
            .pipe(takeLast(1))
            .subscribe({
              next: () => {
                obs.next(true);
                obs.complete();
              },
              error: (err) => {
                //> init error list
                this.noticeContentList = new Array<string>();

                if (this.languageService.getLang() == 'zh-tw') {
                  this.noticeContentList.push(err.error.message);
                } else {
                  this.noticeContentList.push(err.error.messageEn);
                }

                this.noticeCheckDialogParams = {
                  title: this.translateService.instant(
                    'Common.Dialog.Header.Notice'
                  ),
                  visiable: true,
                  mode: 'error',
                };

                this.eccn = null;

                console.error(err);
                obs.next(false);
                obs.complete();
              },
            });
        });

      //> reset notice check dialog setting
      this.noticeCheckDialogParams = {
        visiable: false,
      };

      //> send data to back-end
      if (this.noticeContentList.length == 0 && this.mode === 'add') {
        //> add event
        formValue = {
          ...this.objectFormatService.ObjectClean(formValue),
          ...{
            saveType: 'I',
          },
        };
      }
      if (this.noticeContentList.length == 0 && this.mode === 'edit') {
        //> update event
        formValue = {
          ...this.objectFormatService.ObjectClean(formValue),
          ...{
            saveType: 'U',
          },
        };
      }

      auECCNLERule$(formValue).subscribe((result) => {
        if (result) {
          if (formValue.saveType == 'I') {
            this.noticeContentList = [
              `${this.translateService.instant('Common.Toast.SuccessSave')} ${
                formValue.eccn
              } License Exception Rule`,
            ];
          }
          if (formValue.saveType == 'U') {
            this.noticeContentList = [
              `${this.translateService.instant('Common.Toast.SuccessUpdate')} ${
                formValue.eccn
              } License Exception Rule`,
            ];
          }

          this.noticeCheckDialogParams = {
            title: this.translateService.instant('Common.Dialog.Header.Notice'),
            visiable: true,
            mode: 'success',
          };

          this.resendInformerService.setResendInformerStatus(
            true,
            formValue.eccn
          );
          this.onDialogClosed();
        }
      });
    }
  }

  //> on init LEH view header
  onInitLEHView(): void {
    //> get eccn list by api
    const getEccnList$ = (): Observable<ECCNInfo['eccn'][]> =>
      new Observable<ECCNInfo['eccn'][]>((obs) => {
        this.licenseControlApiService
          .getECCNList()
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.eccnList);
            obs.complete();
          });
      });

    //> init eccn list options
    this.eccnListOptions = new BehaviorSubject<SelectItem<ECCNInfo['eccn']>[]>(
      []
    );

    getEccnList$().subscribe((res) => {
      res.forEach((eccn) => {
        this.eccnListOptions.next([
          ...this.eccnListOptions.getValue(),
          { label: eccn, value: eccn },
        ]);
      });
    });
  }

  onInitFormValue(): void {
    this.eccn = null;
    this.flag = 'Y';
    this.civ = 'N';
    this.gbs = 'N';
    this.enc = 'N';
    this.lvs = 'N';
    this.orderAmt = null;
    this.yearAmt = null;
    this.remark = null;
  }
}
