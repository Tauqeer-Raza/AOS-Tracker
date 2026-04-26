export const getTodayDate = () => new Date().toISOString().split("T")[0];

export const normalizeDateRange = (fromDate, toDate) => {
  const today = getTodayDate();
  return {
    fromDate: fromDate || today,
    toDate: toDate || today,
  };
};
