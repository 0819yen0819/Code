import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function asciiValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const value = control.value;

    if (!value) {
      return null;
    }

    const re = new RegExp('[^\\x00-\\x7F\\uFF01-\\uFF20\\uFF3B-\\uFF40\\uFF5B-\\uFFFD\\u2000-\\u2FFF\\u3000-\\u303F\\uFE10-\\uFE4F\\u00A0]');

    return re.test(value) ? { ascii: true } : null;
  }
}