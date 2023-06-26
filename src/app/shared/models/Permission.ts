import { Deserializable } from './helpers/deserializable';


export class Permission implements Deserializable{
  ID: number
  create: boolean
  edit: boolean
  view: boolean
  delete: boolean

  deserialize(input: any): this {
    return Object.assign(this, input);
  }
}
