import { SpecGenerator } from '../specGenerator';
import * as oas3 from 'openapi3-ts';
import {
  APISchema,
  FieldDataType,
  FieldInType,
  MinValueConstraint,
  RequestParameter,
  RequiredConstraint,
  ResponseProperty,
} from '@vulcan/core';

export class OAS3SpecGenerator extends SpecGenerator<oas3.OpenAPIObject> {
  // Follow the OpenAPI specification version 3.0.3
  // see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md
  private oaiVersion = '3.0.3';

  public getSpec() {
    const spec: oas3.OpenAPIObject = {
      openapi: this.getOAIVersion(),
      info: this.getInfo(),
      paths: this.getPaths(),
    };
    return spec;
  }

  public getOAIVersion() {
    return this.oaiVersion;
  }

  private getInfo(): oas3.InfoObject {
    return {
      title: this.getName(),
      version: this.getVersion(),
      description: this.getDescription(),
    };
  }

  private getPaths(): oas3.PathsObject {
    const paths: oas3.PathsObject = {};
    const schemas = this.getSchemas();
    for (const schema of schemas) {
      paths[this.convertToOASPath(schema.urlPath)] = this.getPath(schema);
    }
    return paths;
  }

  private getPath(schema: APISchema): oas3.PathItemObject {
    return {
      get: this.getOperationObject(schema),
    };
  }

  // "/user/:id" -> "/user/{id}"
  private convertToOASPath(path: string) {
    return path.replace(/:([^/]+)/g, (_, param) => {
      return `{${param}}`;
    });
  }

  private getOperationObject(schema: APISchema): oas3.OperationObject {
    return {
      description: schema.description,
      responses: this.getResponsesObject(schema),
      parameters: this.getParameterObject(schema),
    };
  }

  private getParameterObject(schema: APISchema): oas3.ParameterObject[] {
    const parameters: oas3.ParameterObject[] = [];
    const requests = schema.request || [];

    for (const param of requests) {
      parameters.push({
        name: param.fieldName,
        in: this.convertFieldInTypeToOASIn(param.fieldIn),
        schema: this.getSchemaObjectFromParameter(param),
        required: this.isParameterRequired(param),
      });
    }

    return parameters;
  }

  private convertFieldInTypeToOASIn(
    fieldInType: FieldInType
  ): oas3.ParameterLocation {
    switch (fieldInType) {
      case FieldInType.HEADER:
        return 'header';
      case FieldInType.PATH:
        return 'path';
      case FieldInType.QUERY:
        return 'query';
      default:
        throw new Error(`FieldInType ${fieldInType} is not supported`);
    }
  }

  private getSchemaObjectFromParameter(
    parameter: RequestParameter
  ): oas3.SchemaObject {
    const schema: oas3.SchemaObject = {
      type: this.convertFieldDataTypeToOASType(parameter.type),
    };
    const minValueConstraint = parameter.constraints.find(
      (constraint) => constraint instanceof MinValueConstraint
    ) as MinValueConstraint;
    if (minValueConstraint) schema.minimum = minValueConstraint.getMinValue();

    return schema;
  }

  private convertFieldDataTypeToOASType(
    fieldDataType: FieldDataType
  ): oas3.SchemaObject['type'] {
    switch (fieldDataType) {
      case FieldDataType.BOOLEAN:
        return 'boolean';
      case FieldDataType.NUMBER:
        return 'number';
      case FieldDataType.STRING:
        return 'string';
      default:
        throw new Error(`FieldDataType ${fieldDataType} is not supported`);
    }
  }

  private isParameterRequired(parameter: RequestParameter) {
    return parameter.constraints.some(
      (constraint) => constraint instanceof RequiredConstraint
    );
  }

  private getResponsesObject(schema: APISchema): oas3.ResponsesObject {
    return {
      '200': {
        description: 'The default response',
        content: {
          'application/json': {
            schema: this.getSchemaObjectFroResponseProperties(
              schema.response || []
            ),
          },
          'text/csv': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    };
  }

  private getSchemaObjectFroResponseProperties(
    responseProperties: ResponseProperty[]
  ): oas3.SchemaObject {
    const required = responseProperties
      .filter((property) => property.required)
      .map((property) => property.name);
    const properties: Record<string, oas3.SchemaObject> = {};
    for (const property of responseProperties) {
      properties[property.name] =
        this.getSchemaObjectFroResponseProperty(property);
    }
    return {
      type: 'object',
      properties,
      required: required.length === 0 ? undefined : required,
    };
  }

  private getSchemaObjectFroResponseProperty(
    responseProperty: ResponseProperty
  ): oas3.SchemaObject {
    const basicContent = {
      description: responseProperty.description,
    };
    if (responseProperty.type === FieldDataType.BOOLEAN) {
      return {
        ...basicContent,
        type: 'boolean',
      };
    } else if (responseProperty.type === FieldDataType.STRING) {
      return {
        ...basicContent,
        type: 'string',
      };
    } else if (responseProperty.type === FieldDataType.NUMBER) {
      return {
        ...basicContent,
        type: 'number',
      };
    } else {
      return {
        ...basicContent,
        ...this.getSchemaObjectFroResponseProperties(
          responseProperty.type || []
        ),
      };
    }
  }
}
