import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'parseThousand',
})
export class ParseThousandPipe implements PipeTransform {
  transform(value: number, ...args: unknown[]): string {
    return this.toThousandNumber(value);
  }

  toThousandNumber(param: number) {
    const paramStr = param.toString();
    //# for safari
    const regExp = new RegExp('\\B(?<!\\.\\d*)(?=(\\d{3})+(?!\\d))', 'g');
    if (paramStr.length > 3) {
      return paramStr.replace(regExp, ',');
    }
    return paramStr;
  }
}
