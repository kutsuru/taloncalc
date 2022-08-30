import {
  KeyValueChangeRecord,
  KeyValueChanges,
  KeyValueDiffer,
  KeyValueDiffers,
  Pipe,
  PipeTransform,
} from '@angular/core';

export interface KeyValue<K, V> {
  key: K;
  value: V;
}

function makeKeyValuePair<K, V>(key: K, value: V): KeyValue<K, V> {
  return { key: key, value: value };
}
@Pipe({
  name: 'jobfilter',
})
export class FilteredKeyValuePipe implements PipeTransform {
  private keyValues: Array<KeyValue<string, any>> = [];
  private keys: Array<string> = [];

  transform(
    input: Object,
    sort: boolean,
    flag: boolean,
    valueFilter: number
  ): KeyValue<string, any>[] {
    this.keyValues = [];

    if (input) {
      Object.entries(input).forEach(([key, value]) => {
        if (
          !flag ||
          (valueFilter && (value['job'] & valueFilter) === valueFilter) || // Job mask application
          !value['isTrans'] // Class filter for baby class
        ) {
          this.keyValues.push(makeKeyValuePair(key, value));
        }
      });

      if (sort) {
        this.keyValues.sort((a, b) => (a.key > b.key ? 1 : -1));
      }
    }

    return this.keyValues;
  }

  filterKeys(
    input: Object,
    filter: boolean,
    valueFilter: number,
    sort: boolean = true
  ): string[] {
    let keys: Array<string> = [];
    if (input) {
      console.log("Filter activated: " + filter);
      console.log(input);
      Object.entries(input).forEach(([key, value]) => {
        if (
          !filter ||
          (valueFilter && (value['job'] & valueFilter) === valueFilter) || // Job mask application
          !value['isTrans'] // Class filter for baby class
        ) {
          keys.push(key);
        }
      });

      if (sort) keys.sort((a, b) => (a > b ? 1 : -1));
    }
    console.log(keys);

    return keys;
  }
}
