import {
  DataSource,
  PrepareParameterFunc,
  RequestParameter,
} from '@vulcan-sql/core/models';
import { inject, injectable, interfaces } from 'inversify';
import { TYPES } from '@vulcan-sql/core/types';
import { DataQueryBuilder, IDataQueryBuilder } from './builder';
import { IParameterizer } from './parameterizer';

export interface IExecutor {
  createBuilder(
    profileName: string,
    query: string,
    parameterizer: IParameterizer
  ): Promise<IDataQueryBuilder>;
  prepare: PrepareParameterFunc;
}

@injectable()
export class QueryExecutor implements IExecutor {
  private dataSourceFactory: interfaces.SimpleFactory<DataSource>;

  constructor(
    @inject(TYPES.Factory_DataSource)
    dataSourceFactory: interfaces.SimpleFactory<DataSource>
  ) {
    this.dataSourceFactory = dataSourceFactory;
  }

  public async prepare(request: RequestParameter) {
    return this.dataSourceFactory(request.profileName)!.prepare(request);
  }

  /**
   * create data query builder
   * @returns
   */
  public async createBuilder(
    profileName: string,
    query: string,
    parameterizer: IParameterizer
  ) {
    return new DataQueryBuilder({
      statement: query,
      parameterizer,
      dataSource: this.dataSourceFactory(profileName)!,
      profileName,
    });
  }
}
