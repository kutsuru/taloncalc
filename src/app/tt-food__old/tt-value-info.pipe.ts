import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'valueinfo',
})
export class TtValueInfo implements PipeTransform {
  transform(value: any, key: string): string {
    return value[key];
  }
}
