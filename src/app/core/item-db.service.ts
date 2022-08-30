import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { ItemDB } from './models';

@Injectable({
  providedIn: 'root'
})
export class ItemDbService {
  constructor(private httpClient: HttpClient) {}

  loadDatabase(dbPath : string) {
    return this.httpClient.get<ItemDB>(dbPath).pipe(
      map((itemDbResp, index) => {
        /* parse the data and save it somewhere in that service or just return it and save the data in the core service*/
        return itemDbResp;
      })
    );
  }
}
