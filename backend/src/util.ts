export async function asyncAll<T>(a: AsyncIterable<T>): Promise<Awaited<T>[]> {
  const ret = [];
  for await (const v of a) {
    ret.push(v);
  }
  return ret;
}

export class IdGenerator {
  private id = 0;
  next(): number {
    return this.id++;
  }
}
