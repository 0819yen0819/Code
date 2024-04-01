import { TranslateService } from '@ngx-translate/core';
import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  skipWhile,
  Subject,
  takeUntil,
} from 'rxjs';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { SimpleUserInfo } from 'src/app/core/model/user-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-common-apply-action-dialog',
  templateUrl: './apply-action-dialog.component.html',
  styleUrls: ['./apply-action-dialog.component.scss'],
})
export class ApplyActionDialogComponent implements OnInit, OnChanges {
  @Input() settingParams!: DialogSettingParams;
  @Output() outputResult = new EventEmitter<string[]>();

  private unsubscribeEvent = new Subject();

  formGroup!: FormGroup;

  dialogSetting!: BehaviorSubject<DialogSettingParams>;
  actionRadioKit!: {
    label: string;
    value: string;
  }[];

  fuzzyEmpInfosOptions!: BehaviorSubject<SelectItem<SimpleUserInfo>[]>;

  constructor(
    private translateService: TranslateService,
    private formBuilder: FormBuilder,
    private authApiService: AuthApiService,
    private userContextService: UserContextService
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

    this.formGroup = this.formBuilder.group({
      action: [null, [Validators.required]],
      cosigners: [null, [Validators.required]],
    });

    this.fuzzyEmpInfosOptions = new BehaviorSubject<
      SelectItem<SimpleUserInfo>[]
    >([]);
  }

  ngOnChanges(): void {
    //> when any changes, reset dialog setting params
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.dialogSetting.getValue().visiable) {
        this.formGroup.reset();
        this.formGroup.get('action').setValue('addAssignee');
        this.onInitOption();

        this.translateService.onLangChange
          .pipe(takeUntil(this.unsubscribeEvent))
          .subscribe(() => {
            this.onInitOption();
          });
      } else {
      }
    }
  }

  onInitOption(): void {
    this.actionRadioKit = [
      {
        label: this.translateService.instant(
          'LicenseMgmt.Common.Option.SeekEndorsement'
        ),
        value: 'addAssignee',
      },
    ];
  }

  //> get simple emp info by keyword ( fuzzy search )
  onCosignersFilterHandler(event): void {
    const getFuzzyEmpInfo$ = (keyword: string): Observable<SimpleUserInfo[]> =>
      new Observable<SimpleUserInfo[]>((obs) => {
        const tenant = this.userContextService.user$.getValue().tenant;

        if (keyword != '' && keyword != undefined) {
          this.authApiService
            .getAllEmpByTenant(tenant, keyword)
            .pipe(skipWhile((data) => data.type == 0))
            .subscribe((res) => {
              obs.next(res.body);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    getFuzzyEmpInfo$(event.query).subscribe((empInfos) => {
      this.fuzzyEmpInfosOptions.next([]);

      for (const empInfo of empInfos) {
        if (
          this.fuzzyEmpInfosOptions
            .getValue()
            .findIndex((data) => data.value.staffCode == empInfo.staffCode) ==
          -1
        ) {
          this.fuzzyEmpInfosOptions.next([
            ...this.fuzzyEmpInfosOptions.getValue(),
            {
              label: `${empInfo.staffCode} ${empInfo.fullName} ${empInfo.nickName}`,
              value: empInfo,
            },
          ]);
        }
      }
    });
  }

  onDialogHide(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }

  onFormSubmit(): void {
    const cosigner: string[] = new Array<string>();
    if (typeof this.formGroup.get('cosigners').value.value == 'object') {
      cosigner.push(this.formGroup.get('cosigners').value.value.staffCode);
    } else {
      for (const data of this.formGroup.get('cosigners').value) {
        cosigner.push(data.value.staffCode);
      }
    }
    this.outputResult.emit({
      ...this.formGroup.value,
      ...{ cosigners: cosigner },
    });
  }
}
