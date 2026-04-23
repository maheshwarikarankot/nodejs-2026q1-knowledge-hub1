import { PaginatedResponse } from "./pagination.interface";


export function paginate<T>(
  items   : T[],
  page    : number = 1,
  limit   : number = 10,
): PaginatedResponse<T> {
  const total  = items.length;
  const start  = (page - 1) * limit;
  const end   = start + limit;
  const data   = items.slice(start, end);
  return { data, total, page, limit };
}

export function sortItems<T>(
  items: T[],
  sortBy?: string,
  order: 'asc' | 'desc' = 'asc',
): T[] {
  if (!sortBy) return items;

  return [...items].sort((a: any, b: any) => {
    const valueA = a[sortBy];
    const valueB = b[sortBy];

    if (valueA === undefined || valueB === undefined) return 0;

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      if (order === 'asc') {
        return valueA.localeCompare(valueB);
      }
      return valueB.localeCompare(valueA);
    }

    if (order === 'asc'){
        return valueA - valueB;
    }
    return valueB - valueA;
  });
}