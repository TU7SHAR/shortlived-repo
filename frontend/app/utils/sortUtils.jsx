export function applyFiltersAndSort(data, sortConfig) {
  if (!data) return [];
  let result = [...data];

  // 1. Apply Filtering
  if (
    sortConfig.filterKey &&
    sortConfig.filterValue &&
    sortConfig.filterValue !== "All"
  ) {
    if (sortConfig.filterKey === "is_used") {
      const isUsedTarget = sortConfig.filterValue === "Used";
      result = result.filter((item) => item.is_used === isUsedTarget);
    } else {
      result = result.filter(
        (item) => item[sortConfig.filterKey] === sortConfig.filterValue,
      );
    }
  }

  // 2. Apply Sorting
  result.sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    // Handle nulls
    if (valA === null || valA === undefined) valA = "";
    if (valB === null || valB === undefined) valB = "";

    // Handle Dates
    if (sortConfig.key.includes("at")) {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return result;
}
