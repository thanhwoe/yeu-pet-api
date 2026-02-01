export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll?(params?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update?(id: string, data: any): Promise<T>;
  delete(id: string): Promise<T>;
}
