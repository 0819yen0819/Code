import { LoaderService } from 'src/app/core/services/loader.service';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { LicenseViewerHeaderService } from '../../../common/license-viewer-header/license-viewer-header.service';

@Component({
  selector: 'app-add-eccn-single-item',
  templateUrl: './add-eccn-single-item.component.html',
  styleUrls: ['./add-eccn-single-item.component.scss'],
})
export class AddEccnSingleItemComponent implements OnInit {
  formGroup!: FormGroup;
  stateOptions!: SelectItem<string>[];

  isAddSuccess!: boolean;

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  @Output() isUploadDone: EventEmitter<any> = new EventEmitter<any>();
  constructor(
    private formBuilder: FormBuilder,
    private licenseControlApiService: LicenseControlApiService,
    private translateService: TranslateService,
    private licenseViewerHeaderService: LicenseViewerHeaderService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      eccn: [null, [Validators.required]],
      activeFlag: [{ value: 'Y', disabled: true }],
    });

    this.stateOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];
  }

  onCloseAddItemDialog(action: string): void {
    if (action === 'S') {
      this.loaderService.show();
      this.licenseControlApiService
        .addECCNStatus(this.formGroup.get('eccn').value)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.isAddSuccess = true;
            this.formGroup.get('eccn').setValue(null);
            this.loaderService.hide();
            this.noticeContentList = [
              `${this.translateService.instant('Common.Toast.SuccessAdd')}`,
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
            this.isAddSuccess = false;
            console.error(err);
            this.loaderService.hide();
            this.formGroup.get('eccn').setValue(null);
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
    } else {
      this.formGroup.get('eccn').setValue(null);
      this.isUploadDone.emit();
    }
  }

  onCloseNoticeHandler(): void {
    if (this.isAddSuccess) {
      this.licenseViewerHeaderService.setReloadNotice(true);
    }
    this.isUploadDone.emit();
  }
}
