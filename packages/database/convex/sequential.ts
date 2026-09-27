export const mapSequentially = async <Input, Output>(
  items: Input[],
  map: (item: Input) => Promise<Output>,
  initial: Output[] = []
): Promise<Output[]> => {
  const [item, ...remaining] = items;
  if (item === undefined) {
    return initial;
  }
  const output = await map(item);
  return await mapSequentially(remaining, map, [...initial, output]);
};
