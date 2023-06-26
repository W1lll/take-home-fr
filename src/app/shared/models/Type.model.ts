export class Type {
  ID: number
  name: string
  description: string

  constructor(data: any) {
    return Object.assign(this, data);
  }
}
