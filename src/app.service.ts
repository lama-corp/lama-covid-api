import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map, from, distinct, reduce, filter } from 'rxjs';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}

  // { meta: { dateStart, dateEnd, nbDates }, data: { '0-9': [], '10-19': [], ... } }
  async getDailyNewPositives(): Promise<any> {
    return this.httpService
      .get(
        'https://geodes.santepubliquefrance.fr/GC_indic.php?lang=fr&prodhash=03532a63&indic=p&dataset=sp_pos_quot&view=map2&filters=cl_age90=0',
      )
      .pipe(
        map((res) => {
          const observable = from(res.data.content.zonrefs[0].values);

          // Getting date list
          let dates = [];
          observable
            .pipe(
              distinct((value: any) => value.jour),
              reduce((values, value) => [...values, value.jour], []),
            )
            .subscribe((x) => {
              dates = x;
            });

          // Getting data for 0-9
          const data = {};
          observable
            .pipe(
              filter((value: any) => value.cl_age90 === '09'),
              reduce((values, value) => [...values, value.p], []),
            )
            .subscribe((x) => {
              data['0-9'] = x;
            });
          // Getting data for 10-19
          observable
            .pipe(
              filter((value: any) => value.cl_age90 === '09'),
              reduce((values, value) => [...values, value.p], []),
            )
            .subscribe((x) => {
              data['10-19'] = x;
            });

          return {
            meta: {
              dateStart: dates[0],
              dateEnd: dates[dates.length - 1],
            },
            data,
          };
        }),
      );
  }
}
