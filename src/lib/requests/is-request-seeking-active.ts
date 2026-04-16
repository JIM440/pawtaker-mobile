type RequestSeekingState = {
  status?: string | null;
  end_date?: string | null;
  taker_id?: string | null;
};

function localYyyyMmDd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isRequestSeekingActive(
  request: RequestSeekingState | null | undefined,
): boolean {
  if (!request) return false;
  if (request.status !== "open") return false;
  if (request.taker_id) return false;
  if (!request.end_date) return true;

  return String(request.end_date) >= localYyyyMmDd(new Date());
}

