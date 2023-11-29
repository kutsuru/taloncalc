import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lvarray',
})
export class TtLvArrayPipe implements PipeTransform {
  transform(value: any, maxLv: number): any {
    return Array.from({ length: maxLv }, (_, i) => i + 1);
  }
}

@Pipe({
  name: 'range',
})
export class TtRangePipe implements PipeTransform {
  transform(value: any, range: number): any {
    return Array.from({ length: range }, (_, i) => i);
  }
}
