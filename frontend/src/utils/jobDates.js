const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getJobPostedDate(job = {}) {
  return (
    job.postedAt ||
    job.posted_at ||
    job.postedDate ||
    job.posted_date ||
    job.created_at ||
    job.createdAt ||
    job.created_date ||
    null
  );
}

export function formatJobPostedAgo(value) {
  if (!value) return "Just now";

  const postedAt = value instanceof Date ? value : new Date(value);
  const postedTime = postedAt.getTime();

  if (!Number.isFinite(postedTime)) return "Just now";

  const now = new Date();
  if (postedTime > now.getTime()) return "Just now";

  const days = Math.max(0, Math.floor((startOfLocalDay(now) - startOfLocalDay(postedAt)) / DAY_MS));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function formatJobPostedAgoFromJob(job = {}) {
  return formatJobPostedAgo(getJobPostedDate(job));
}

export function compareJobsByPostedDateDesc(a = {}, b = {}) {
  const aTime = new Date(getJobPostedDate(a) || 0).getTime();
  const bTime = new Date(getJobPostedDate(b) || 0).getTime();
  const safeA = Number.isFinite(aTime) ? aTime : 0;
  const safeB = Number.isFinite(bTime) ? bTime : 0;
  return safeB - safeA;
}
