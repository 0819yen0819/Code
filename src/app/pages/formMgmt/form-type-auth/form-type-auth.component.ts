import { LoaderService } from './../../../core/services/loader.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';

import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { FormTypeApiService } from 'src/app/core/services/form-type-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-form-type-auth',
  templateUrl: './form-type-auth.component.html',
  styleUrls: ['./form-type-auth.component.scss'],
})
export class FormTypeAuthComponent implements OnInit {
  @ViewChild('dt') dt: Table;

  private onLangChange$: Subscription;

  permissions: string[] = [];

  categoriesOptions: SelectItem[];
  selectedCategories: string;
  formType: string;
  formTypeNameC: string;
  formTypeNameE: string;
  statusOptions: SelectItem[];
  selectStatus: string;

  cols: any[];
  selectedCols: any[];
  data: any[];
  displayFilterDetail = false;
  displayDetailBlock = false;

  displayEditDetail = false;
  displayDelDetail = false;

  addForm: any;
  editForm: any;
  viewForm: any;
  delForm: any;
  isWithdrawOptions: SelectItem[];
  displayOptions: SelectItem[];

  formTypeRequired: boolean;
  formTypeNameCRequired: boolean;
  formTypeNameERequired: boolean;
  addUrlRequired: boolean;

  isWithdrawDesc: any;
  statusDesc: any;
  categoryDesc: any;
  displayDesc: any;

  constructor(
    private router: Router,
    private translateService: TranslateService,
    private toastService: ToastService,
    private formTypeApiService: FormTypeApiService,
    private userContextService: UserContextService,
    private loaderService: LoaderService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initCategoriesOptions();
      this.initStatusOptions();
      this.initIsWithdrawOptions();
      this.initDisplayOptions();
      this.initTranslateCharacter();
      this.changeFilterDetail();
      this.getFormTypes();
    });
  }

  ngOnInit(): void {
    this.initCategoriesOptions();
    this.initStatusOptions();
    this.initIsWithdrawOptions();
    this.initDisplayOptions();

    this.initTranslateCharacter();

    this.changeFilterDetail();
    //# TK-35854
    // this.getFormTypes();
    this.resetEditForm();
  }

  initTranslateCharacter() {
    this.cols = this.translateService.instant('FormType.Columns');
    this.isWithdrawDesc = this.translateService.instant(
      'FormType.isWithdrawDesc'
    );
    this.statusDesc = this.translateService.instant('FormType.statusDesc');
    this.displayDesc = this.translateService.instant('FormType.displayDesc');
  }

  initCategoriesOptions() {
    // this.formTypeApiService.getCategories().subscribe({
    //   next: rsp => {
    //     // console.log('rsp: ' + JSON.stringify(rsp));

    //     this.categoriesOptions = rsp.categories.map(function (obj) {
    //       return { label: obj, value: obj };
    //     });
    //   },
    //   error: rsp => {
    //     console.log('getCategories error : ' + JSON.stringify(rsp));
    //     this.toastService.error('System.Message.Error');
    //   }
    // });
    this.formTypeApiService.getFormTypeCategories().subscribe({
      next: (rsp) => {
        // console.log('rsp: ' + JSON.stringify(rsp));
        let language = this.translateService.currentLang;
        this.categoriesOptions = [];
        this.categoryDesc = {};
        rsp.categories.forEach((e) => {
          let formCategory = e.formCategory;
          let formCategoryName = '';
          if (language == 'zh-tw') {
            formCategoryName = e.formCategoryNameC;
          } else {
            formCategoryName = e.formCategoryNameE;
          }
          this.categoriesOptions.push({
            label: formCategoryName,
            value: formCategory,
          });
          this.categoryDesc[formCategory] = formCategoryName;
        });
      },
      error: (rsp) => {
        console.log('getCategories error : ' + JSON.stringify(rsp));
        this.toastService.error('System.Message.Error');
      },
    });
  }

  resetCondition() {
    this.selectedCategories = '';
    this.formType = '';
    this.formTypeNameC = '';
    this.formTypeNameE = '';
    this.selectStatus = '';
    this.data = new Array();
  }

  getFormTypes() {
    this.loaderService.show();
    this.data = [];

    let model = {
      category:
        (this.selectedCategories || '') == '' ? null : this.selectedCategories,
      formType: this.formType,
      formTypeNameC: this.formTypeNameC,
      formTypeNameE: this.formTypeNameE,
      status: (this.selectStatus || '') == '' ? null : this.selectStatus,
    };

    this.formTypeApiService
      .getFormTypes(model)
      .pipe(
        finalize(() => {
          this.loaderService.hide();
        })
      )
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }
          this.data = rsp.body.types;
          this.dt.reset();
        },
        error: (rsp) => {
          if (rsp) {
            console.log(rsp);
          }
          this.toastService.error('System.Message.Error');
        },
      });
  }

  showFilter() {
    this.displayFilterDetail = true;
  }

  changeFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    // this.selectedCols.push({ field: 'edit', header: '編輯' });
    if (this.permissions.includes('edit')) {
      this.selectedCols.push(
        this.translateService.instant('FormType.EditColums')
      );
    }
    // this.selectedCols.push({ field: 'del', header: '刪除' });
    // this.selectedCols.push({ field: 'detail', header: '檢視' });
  } // end changeFilterDetail

  resetEditForm() {
    this.editForm = {
      title: '',
      type: '',
      category: '',
      formType: '',
      formTypeNameC: '',
      formTypeNameE: '',
      isWithdraw: '',
      status: '',
      display: '',
      addUrl: '',
      processKey: '',
    };
  }

  showEdit(type: string, data) {
    switch (type) {
      case 'new':
        this.editForm = {
          title: this.translateService.instant(
            'FormType.Title.AddFormTypeAuth'
          ),
          type: 'new',
          isWithdraw: 'true',
          status: 'Activate',
          display: 'true',
        };
        break;
      case 'edit':
        Object.assign(this.editForm, data);
        this.editForm.title = this.translateService.instant(
          'FormType.Title.EditFormTypeAuth'
        );
        this.editForm.type = 'edit';
        break;
      case 'detail':
        this.editForm = {
          title: this.translateService.instant(
            'FormType.Title.ViewFormTypeAuth'
          ),
          type: 'detail',
        };
        break;
      default:
        this.resetEditForm();
    }
    this.displayEditDetail = true;
  } // end showEdit

  closeEdit() {
    console.log('data: ', this.data);
    this.displayEditDetail = false;
    this.resetEditForm();
    this.resetValidate();
  }

  validateAndSaveData() {
    this.validateEditForm().then((x) => {
      if (!x) {
        return;
      }

      this.saveData();
    });
  }

  validateEditForm(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.resetValidate();
      if (!this.editForm.formType || this.editForm.formType == '') {
        this.formTypeRequired = true;
      }
      if (!this.editForm.formTypeNameC || this.editForm.formTypeNameC == '') {
        this.formTypeNameCRequired = true;
      }
      if (!this.editForm.formTypeNameE || this.editForm.formTypeNameE == '') {
        this.formTypeNameERequired = true;
      }
      console.log('display: ', this.editForm.display);
      console.log('addUrl: ', this.editForm.addUrl);
      if(this.editForm.display == 'true' && !this.editForm.addUrl){
        this.addUrlRequired = true;
      }
      if (
        this.formTypeRequired ||
        this.formTypeNameCRequired ||
        this.formTypeNameERequired ||
        this.addUrlRequired
      ) {
        return resolve(false);
      }
      return resolve(true);
    });
  }

  saveData() {
    this.formTypeApiService.saveFormType(this.editForm).subscribe({
      next: (rsp) => {
        // console.log('rsp: ' + JSON.stringify(rsp));
        // console.log('code: ' + rsp.code);
        if (rsp.code === 'Success') {
          this.getFormTypes();
          this.closeEdit();
          this.toastService.success('Success.');
        } else {
          console.log('saveFormType error : ' + JSON.stringify(rsp));
          this.toastService.error('System.Message.Error');
        }
      },
      error: (rsp) => {
        console.log('saveFormType error : ' + JSON.stringify(rsp));
        if (rsp?.status == 500 && rsp.error?.code) {
          this.toastService.error('FormType.Message.' + rsp.error?.code);
        } else{
          this.toastService.error('System.Message.Error');
        }

      },
    });
  }

  resetValidate() {
    this.formTypeRequired = false;
    this.formTypeNameCRequired = false;
    this.formTypeNameERequired = false;
    this.addUrlRequired = false;
  }

  initStatusOptions() {
    this.statusOptions = [];
    this.statusOptions.push.apply(
      this.statusOptions,
      this.translateService.instant('FormType.Options.statusOptions')
    );
  }

  initIsWithdrawOptions() {
    this.isWithdrawOptions = [];
    this.isWithdrawOptions.push.apply(
      this.isWithdrawOptions,
      this.translateService.instant('FormType.Options.isWithdrawOptions')
    );
  }

  initDisplayOptions() {
    this.displayOptions = [];
    this.displayOptions.push.apply(
      this.displayOptions,
      this.translateService.instant('FormType.Options.displayOptions')
    );
  }

  ngOnDestroy(): void {
    [this.onLangChange$].forEach((subscription: Subscription) => {
      if (subscription != null || subscription != undefined)
        subscription.unsubscribe();
    });
  }
}
