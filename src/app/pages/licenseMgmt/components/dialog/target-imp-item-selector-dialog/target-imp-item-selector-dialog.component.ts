import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';
import { takeLast } from 'rxjs/operators';
import { BtnActionType } from 'src/app/core/enums/btn-action';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';

@Component({
  selector: 'app-target-imp-item-selector-dialog',
  templateUrl: './target-imp-item-selector-dialog.component.html',
  styleUrls: ['./target-imp-item-selector-dialog.component.scss'],
})
export class TargetImpItemSelectorDialogComponent implements OnInit {
  @Input() settingParams: SelectorDialogParams;
  @Output() outputResult: EventEmitter<
    {
      productCode: string;
      qty: number;
      formNo: string;
    }[]
  > = new EventEmitter<
    {
      productCode: string;
      qty: number;
      formNo: string;
    }[]
  >();

  dialogSetting!: BehaviorSubject<SelectorDialogParams>;
  itemList!: SelectItem<{
    productCode: string;
    qty: number;
    formNo: string;
  }>[];
  selectedItemList!: {
    productCode: string;
    qty: number;
    formNo: string;
  }[];

  isLoading!: boolean;
  isEmpty!: boolean | null;

  constructor(private licenseControlApiService: LicenseControlApiService) {}

  ngOnInit(): void {
    //> init dialog setting
    this.dialogSetting = new BehaviorSubject<SelectorDialogParams>({
      title: '',
      type: SelectorItemType.NONE,
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });

    this.itemList = new Array();
    this.selectedItemList = new Array();

    //> init loading status
    this.isLoading = false;

    //>init empty status
    this.isEmpty = null;
  }

  //> component value change event handler
  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.dialogSetting.getValue().visiable) {
        this.isLoading = true;
        this.onQueryImportLicenseDataByFormNo();
      }
    }
  }

  private onQueryImportLicenseDataByFormNo(): void {
    const queryImportLicenseDataByFormNo$ = (model: {
      ouCode: string;
      formNo: string;
    }): Observable<
      {
        productCode: string;
        qty: number;
        formNo: string;
      }[]
    > =>
      new Observable<
        {
          productCode: string;
          qty: number;
          formNo: string;
        }[]
      >((obs) => {
        this.licenseControlApiService
          .queryImportLicenseDataByFormNo(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.datas);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    this.itemList = new Array();
    queryImportLicenseDataByFormNo$({
      ouCode: this.dialogSetting.getValue().data.ouCode,
      formNo: this.dialogSetting.getValue().data.formNo,
    }).subscribe((data) => {
      this.isLoading = false;
      if (data.length > 0) {
        this.isEmpty = false;
        data.forEach((item) => {
          this.itemList.push({
            label: item.productCode,
            value: item,
          });
        });
      } else {
        this.isEmpty = true;
      }
    });
  }

  onSelectResultChange(item: SelectItem): void {
    this.selectedItemList = item.value;
  }

  onSelectSubmit(type: string): void {
    if (type === BtnActionType.SUBMIT) {
      this.outputResult.emit(this.selectedItemList);
    }

    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }
}
