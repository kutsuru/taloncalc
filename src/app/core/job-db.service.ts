import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { JobDB } from './models';

@Injectable({
  providedIn: 'root'
})
export class JobDbService {
  constructor(private httpClient: HttpClient) {}

  loadDatabase() {
    return this.httpClient.get<JobDB>('assets/db/job.db.json').pipe(
      map((jobDbResp, index) => {
        /* parse or just return it */
        return jobDbResp;
      })
    );
  }
}
