/* eslint-disable @typescript-eslint/no-explicit-any */
const checkIfValid = (array: any[]) => {
  let notValidCount = 0;
  array.map((vars: any) => {
    if (vars.trim() == "") {
      notValidCount += 1;
    }
  });

  return notValidCount > 0 ? false : true;
};

const getUniqueItemsOfObjects = (
  array: any[],
  key: string,
  sort_by_key: string
) => {
  // 1. Filter for unique items based on a specific key (e.g., 'id')
  const uniqueItems = array.filter(
    (value, index, self) =>
      self.findIndex((v) => v[key] === value[key]) === index
  );
  // Note: This filter keeps the first occurrence of a unique key value.

  // 2. Sort the unique items by the 'date' property in descending order (latest date first)
  uniqueItems.sort((a, b) => {
    // Convert the ISO date strings to Date objects for accurate comparison
    const dateA: any = new Date(a[sort_by_key]);
    const dateB: any = new Date(b[sort_by_key]);

    // For descending order, return a negative value if dateA is more recent than dateB
    // or a positive value if dateA is older than dateB
    return dateB - dateA;
  });

  return uniqueItems;
};

const removeNullsFromObject = (obj: any) => {
  const new_obj = obj;
  Object.keys(new_obj).forEach((key) => {
    if (new_obj[key] === null) {
      delete new_obj[key];
    }
  });

  return new_obj;
};

export { checkIfValid, getUniqueItemsOfObjects, removeNullsFromObject };
