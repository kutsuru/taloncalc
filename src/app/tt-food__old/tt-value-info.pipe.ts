import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'valueinfo',
    standalone: true,
})
export class TtValueInfo implements PipeTransform {
  transform(value: any, key: string): string {
    return value[key];
  }
}
