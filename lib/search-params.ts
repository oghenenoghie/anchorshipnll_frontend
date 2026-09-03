export type SearchParams = { [key: string]: string | string[] | undefined };

export function paramValues(searchParams: SearchParams, key: string): string[] {
  const raw = searchParams[key];
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function firstParam(searchParams: SearchParams, key: string): string {
  return paramValues(searchParams, key)[0] ?? "";
}

export function toggleParamHref(
  pathname: string,
  searchParams: SearchParams,
  key: string,
  value: string,
): string {
  const params = new URLSearchParams();

  for (const [paramKey, paramValue] of Object.entries(searchParams)) {
    if (paramValue === undefined) continue;
    const values = Array.isArray(paramValue) ? paramValue : [paramValue];
    for (const v of values) params.append(paramKey, v);
  }

  const current = params.getAll(key);
  const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

  params.delete(key);
  for (const v of next) params.append(key, v);

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
