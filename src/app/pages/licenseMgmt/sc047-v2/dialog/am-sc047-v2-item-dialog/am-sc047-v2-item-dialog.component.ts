import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Subject, take } from 'rxjs';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import {
  DialogSettingParams,
  SelectorDialogParams
} from 'src/app/core/model/selector-dialog-params';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { AmSc047ItemInitService } from './services/am-sc047-item-init.service';
import { AmSc047ItemProcessService } from './services/am-sc047-item-process.service';

@Component({
  selector: 'app-am-sc047-v2-item-dialog',
  templateUrl: './am-sc047-v2-item-dialog.component.html',
  styleUrls: ['./am-sc047-v2-item-dialog.component.scss'],
})
export class AmSc047V2ItemDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: DialogSettingParams;
  @Output() outputResult: EventEmitter<any> = new EventEmitter<any>();

  private unSubscribeEvent = new Subject();

  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  formGroup!: FormGroup;

  //> item info
  itemInfo!: any;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;
  selectorType!: string;

  licenseOptions!: SelectItem<any>[];
  licenseNoPlaceHolder!: string;
  licenseControlNum!: number;
  licenseLoading!: boolean;

  //>submit btn label value
  submitBtnLabel!: string;

  constructor(
    private amSc047ItemInitService: AmSc047ItemInitService,
    private AmSc047ItemProcessService: AmSc047ItemProcessService,
    private translateService: TranslateService,
    private objectFormatService: ObjectFormatService,
    private userContextService: UserContextService
  ) {}

  ngOnInit(): void {
    this.dialogSetting = new BehaviorSubject<DialogSettingParams>(
      this.amSc047ItemInitService.onInitDialogSettings()
    );
    this.formGroup = this.amSc047ItemInitService.onInitForm();
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.dialogSetting.getValue().visiable) {
        this.unSubscribeEvent = new Subject();
        this.licenseOptions = new Array<SelectItem<any>>();
        this.licenseLoading = false;
        this.formGroup.reset();
        this.itemInfo = null;

        //> 當開啟模式為新增
        if (this.dialogSetting.getValue().mode === 'add') {
          this.licenseNoPlaceHolder = `${this.translateService.instant(
            'LicenseMgmt.SC047.PlaceHolder.PlzSelectItem'
          )}`;
          this.submitBtnLabel =
            this.translateService.instant('Button.Label.Add');
          this.formGroup.get('quantity').disable({ onlySelf: true });
        }
        //> 當開啟模式為修改
        else {

          for (const key of Object.keys(this.formGroup.getRawValue())) {
            if (key === 'quantity') {
              this.formGroup
                .get(key)
                .setValue(
                  this.objectFormatService.RecorveryThousandFormat(
                    this.settingParams.data.selectedItemInfo[key]
                  )
                );
            } else {
              this.formGroup
                .get(key)
                .setValue(this.settingParams.data.selectedItemInfo[key]);
            }
          }

          this.itemInfo = this.settingParams.data.selectedItemInfo;

          this.querySpecialImportLicense();

          this.submitBtnLabel = this.translateService.instant(
            'Button.Label.Modify'
          );

          //> 控管 Flowing 表單狀態
          if (this.settingParams.data.isWarehouseMember) {
            this.formGroup.disable();
            this.formGroup.get('quantity').enable({ onlySelf: true });
            this.formGroup.get('receipt').enable({ onlySelf: true });
            this.formGroup.get('remark').enable({ onlySelf: true });
          }
        }
      }
    }
  }

  onOpenSelectorDialogEvent(type: 'item' | 'specialImportLicesne'): void {
    this.selectorType = type;
    if (type === SelectorItemType.ITEM) {
      this.selectorDialogParams = {
        title: `${this.translateService.instant('Dialog.Header.Choose')} Item`,
        type: SelectorItemType.ITEM,
        visiable: true,
      };
    } else {
      this.selectorDialogParams = {
        title: `${this.translateService.instant(
          'Dialog.Header.Choose'
        )} Import License No.`,
        type: SelectorItemType.SPECIAL_IMPORT_LICENSE,
        visiable: true,
        data: {
          ouCode: this.settingParams.data.ouCode,
          productCode: this.formGroup.get('productCode').value,
        },
      };
    }
  }

  //> open selector dialog callback
  onSelectorDialogCallback(result: SelectItem<any>): void {
    if (result.value) {
      //> 壓值
      this.itemInfo = result.value;
      this.formGroup.get('productCode').setValue(this.itemInfo.invItemNo);
      this.formGroup.get('ccats').setValue(this.itemInfo.ccats);

      this.licenseLoading = true;
      this.licenseNoPlaceHolder = `${this.translateService.instant(
        'LicenseMgmt.SC047.PlaceHolder.Loading'
      )}`;

      this.formGroup.get('quantity').setValue(null);

      this.querySpecialImportLicense();
    }
  }

  onImportLicenseKitChange(): void {
    this.formGroup
      .get('license')
      .setValue(this.formGroup.get('licenseKit').value.licenseNo);
    this.formGroup
      .get('refFormNo')
      .setValue(this.formGroup.get('licenseKit').value.formNo);
    this.formGroup
      .get('scFlagType')
      .setValue(this.formGroup.get('licenseKit').value.scFlagType);
    this.licenseControlNum = this.formGroup.get('licenseKit').value.controlQty;

    //> 當 IMP License 替換時，清空 qty
    this.formGroup.get('quantity').enable({ onlySelf: true });
    this.formGroup.get('quantity').setValue(null);
  }

  //> close selector dialog event
  onCloseAMItemDialogEvent(): void {
    //> close item add dialog
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });

    this.unSubscribeEvent.next(null);
    this.unSubscribeEvent.complete();
  }

  onFormSubmit(): void {
    const result = this.objectFormatService.ObjectClean(
      this.formGroup.getRawValue()
    );
    delete result.licenseKit;
    this.outputResult.emit(result);
  }

  private querySpecialImportLicense(): void {
    //> 直接觸發搜尋 IMP License
    this.AmSc047ItemProcessService.onQuerySpecialImportLicense({
      tenant: this.userContextService.user$.getValue().tenant,
      ouCode: this.settingParams.data.ouCode,
      productCode: this.formGroup.get('productCode').value,
      action: 'formQuery',
      active: 'Y',
    })
      .pipe(take(1))
      .subscribe((res) => {
        this.licenseLoading = false;
        this.licenseOptions = res;
        if (res.length > 0) {
          let impLicense;

          if (this.dialogSetting.getValue().mode === 'add') {
            impLicense = res[0].value;
          } else {
            impLicense = res.filter(
              (x) => x.value.licenseNo === this.formGroup.get('license').value
            )[0].value;
          }
          this.formGroup.get('licenseKit').setValue(impLicense);
          this.formGroup.get('license').setValue(impLicense.licenseNo);
          this.formGroup.get('refFormNo').setValue(impLicense.formNo);
          this.formGroup.get('scFlagType').setValue(impLicense.scFlagType);
          this.licenseControlNum = impLicense.controlQty;

          this.formGroup.get('quantity').enable({ onlySelf: true });
        } else if (res.length === 0) {
          this.formGroup.get('licenseKit').setValue(null);
          this.formGroup.get('licenseKit').disable({ onlySelf: true });
          this.licenseNoPlaceHolder = `${this.translateService.instant(
            'Input.PlaceHolder.NoMatch'
          )}  Import License No.`;
        } else if (res.length === 1) {
          const impLicense = res[0].value;
          this.formGroup.get('licenseKit').setValue(impLicense);
          this.formGroup.get('license').setValue(impLicense.licenseNo);
          this.formGroup.get('refFormNo').setValue(impLicense.formNo);
          this.formGroup.get('scFlagType').setValue(impLicense.scFlagType);
          this.formGroup.get('quantity').enable({ onlySelf: true });
          this.licenseControlNum = impLicense.controlQty;
        } else {
          this.licenseNoPlaceHolder = `${this.translateService.instant(
            'Input.PlaceHolder.PleaseSelect'
          )}  Import License No.`;
          this.formGroup.get('licenseKit').enable({ onlySelf: true });
          this.formGroup.get('quantity').enable({ onlySelf: true });
        }
      });
  }
}
