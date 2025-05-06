export function formatDate(timestamp: string) {
  if (!timestamp.includes(".")) {
    timestamp = timestamp + ".000000";
  }
  return new Date(timestamp).toISOString().split("T")[0];
}

export function getPastMonth(monthsBack: number) {
  const m = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date();
  for (let i = 0; i < monthsBack; i++) {
    date.setMonth(date.getMonth() - 1);
  }
  return {
    title: m[date.getMonth()] + " " + date.getFullYear().toString(),
    value: monthsBack,
    start: new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
  };
}

export function getStartDate(month: number | null) {
  return month !== null
    ? getPastMonth(Number(month)).start
    : getPastMonth(120).start;
  }

export function getEndDate(month: number | null) {
  return month !== null
    ? getPastMonth(Number(month)).end
    : getPastMonth(0).end;
  }

export function getQueryPayload(
  tableType: string,
  month: number | null = null,
  category: string | null = "",
  name: string = "",
  customer: string = ""
) {
  let query: Object = {};
  if (tableType === "associate") {
    query = {
      name: name,
      start_date: getStartDate(month),
      end_date: getEndDate(month),
    };
    if (category !== "") {
      query = { ...query, category: category };
    }
  } else {
    query = {
      category: tableType.replace("manager-", ""),
      name: name,
      customer: customer,
      start_date: getStartDate(month),
      end_date: getEndDate(month),
    };
    if (name) {
      query = { ...query, name: name };
    }
  }
  return query;
}

export function getRecommendationPayload(
  tableType: string,
  items: any[],
  itemsHash: number
) {
  return {
    query: items.map((item) => ({
      number: item.row_num,
      category: item.category,
      submission: item["text"],
    })),
    action: `tableStore/${tableType}`,
    message_id: itemsHash,
  };
}

export function getCombineSubmissionsPayload(
  tableType: string,
  items: any[],
) {
  return {
    query: items.map((item) => item["text"]),
    action: `tableStore/${tableType}`,
    message_id: "combine_submissions",
  };
}

// Helper function to clean and trim a JSON string
export function cleanJsonString(str: string) {
  const startIndex = str.indexOf('{');
  if (startIndex > -1) {
    str = str.slice(startIndex) // Remove extra text before the JSON
  }
  return str
    .replace(/[\n\r]+/g, " ") // Remove line-breaks
    .trim();
}
