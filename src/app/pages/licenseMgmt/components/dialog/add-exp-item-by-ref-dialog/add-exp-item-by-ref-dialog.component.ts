import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, from, map, Observable, takeLast } from 'rxjs';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { ERPEXPDOInfo } from 'src/app/core/model/exp-ref-info';
import { ItemInfo } from 'src/app/core/model/item-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { ImpexpProcessService } from '../../../impexp/services/impexp-process.service';

@Component({
  selector: 'app-add-exp-item-by-ref-dialog',
  templateUrl: './add-exp-item-by-ref-dialog.component.html',
  styleUrls: ['./add-exp-item-by-ref-dialog.component.scss'],
})
export class AddExpItemByRefDialogComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() settingParams: DialogSettingParams;
  @Output() outputResult: EventEmitter<ERPEXPDOInfo[]> = new EventEmitter<
    ERPEXPDOInfo[]
  >();

  formGroup!: FormGroup;

  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  itemCols!: TableCol[];

  EXPRefAPIParams!: BehaviorSubject<{
    key: string;
    url: string;
  }>;

  expDOList!: ERPEXPDOInfo[];

  //> data selected
  selectedData: ERPEXPDOInfo[];

  isLoading!: boolean;
  isEmpty!: boolean;

  constructor(
    private formbuilder: FormBuilder,
    private licenseControlApiService: LicenseControlApiService,
    private commonApiService: CommonApiService,
    private impexpProcessService: ImpexpProcessService,
    private objectFormatService: ObjectFormatService
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

    //> init form
    this.formGroup = this.formbuilder.group({
      keyword: ['', [Validators.required]],
    });

    //> init loading status
    this.isLoading = false;

    //> init exp ref api params
    this.EXPRefAPIParams = new BehaviorSubject<{
      key: string;
      url: string;
    }>({
      key: '',
      url: '',
    });

    //> set up exp ref api from ERP
    this.impexpProcessService.getEXPDOAPIParamsFromERP$().subscribe((res) => {
      this.EXPRefAPIParams.next(res);
    });

    this.onInitTableCols();
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });
    }
  }

  ngOnDestroy(): void {
    this.EXPRefAPIParams.next({
      key: '',
      url: '',
    });
  }

  onInitTableCols(): void {
    this.itemCols = [
      {
        field: 'trx_no',
        label: 'Ref Shipment#',
      },
      {
        field: 'org_id',
        label: 'OU',
        isFittedCol: true,
      },
      {
        field: 'part_no',
        label: 'ITEM',
      },
      {
        field: 'eccn1',
        label: 'ECCN',
      },
      {
        field: 'ccats',
        label: 'CCATs',
        isFittedCol: true,
      },
      {
        field: 'target_no',
        label: 'Customer/Vendor',
      },
      {
        field: 'ship_qty',
        label: 'SHIP_QTY',
      },
    ];
  }

  //> 關鍵字清理重整事件
  onSearchKeywordClean(): void {
    this.formGroup.get('keyword').setValue('');
    this.formGroup.enable({ onlySelf: true });
    this.selectedData = new Array<ERPEXPDOInfo>();
    this.expDOList = new Array<ERPEXPDOInfo>();
    this.isEmpty = false;
  }

  //> 關鍵字清理重整事件 active by special key down event
  onSearchKeyDownHandler(key: KeyboardEvent): void {
    if (key.code === 'Backspace' || key.code === 'Delete') {
      this.onSearchKeywordClean();
    }
  }

  onSearchEXPRefSubmit(): void {
    const expDOList$ = (trxNo: string): Observable<ERPEXPDOInfo[]> =>
      new Observable<ERPEXPDOInfo[]>((obs) => {
        this.licenseControlApiService
          .getEXPDOListFromERP(
            this.EXPRefAPIParams.getValue(),
            this.objectFormatService.ObjectClean({
              ...this.settingParams.data,
              ...{ trxNo: trxNo },
            })
          )
          .pipe(takeLast(1))
          .subscribe({
            next: (res: { xxomLicenseShipment: ERPEXPDOInfo[] | null }) => {
              if (res.xxomLicenseShipment) {
                obs.next(res.xxomLicenseShipment);
              } else {
                obs.next([]);
              }
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    const checkProductCode$ = (
      productCode: ItemInfo['invItemNo']
    ): Observable<any> =>
      new Observable<any>((obs) => {
        this.commonApiService
          .getTargetItemInfo(productCode)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.itemInfo);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next({});
              obs.complete();
            },
          });
      });

    this.isLoading = true;
    this.selectedData = new Array<ERPEXPDOInfo>();
    this.expDOList = new Array<ERPEXPDOInfo>();

    expDOList$(this.formGroup.get('keyword').value).subscribe((res) => {
      if (res.length === 0) {
        this.isLoading = false;
        this.isEmpty = true;
      } else {
        this.isEmpty = false;
        from(res).subscribe((item) => {
          checkProductCode$(item.part_no)
            .pipe(map((info) => ({ ...item, ...info })))
            .subscribe((output) => {
              this.expDOList.push(output);
              if (this.expDOList.length === res.length) {
                this.isLoading = false;
              }
            });
        });
      }
    });
  }

  onSelectedDataRecive(data: ERPEXPDOInfo[]): void {
    this.selectedData = data;
  }

  onSelectedDataSubmit(): void {
    const outputData = new Array();
    for (const data of this.selectedData) {
      outputData.push({
        refShipment: this.formGroup.get('keyword').value
          ? this.formGroup.get('keyword').value.toString().trim()
          : this.formGroup.get('keyword').value,
        productCode: data.part_no,
        eccn: `${data['eccn'] ? data['eccn'] : null}`,
        ccats: data.ccats,
        quantity: data.ship_qty,
      });
    }
    this.outputResult.emit(outputData);
    this.onCloseDialogHandler();
  }

  onCloseDialogHandler(): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }
}
