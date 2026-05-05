import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale("en", {
  relativeTime: {
    future: "trong %s",
    past: "%s trước",
    s: "vài giây",
    m: "1 phút",
    mm: "%d phút",
    h: "1 giờ",
    hh: "%d giờ",
    d: "1 ngày",
    dd: "%d ngày",
    M: "1 tháng",
    MM: "%d tháng",
    y: "1 năm",
    yy: "%d năm",
  },
});

export const authorName = (author) => {
  if (!author) return "Unknown User";
  return `${author.firstName} ${author.lastName}`;
};

export const formatDate = (dateString, format = "YYYY-MM-DD HH:mm") => {
  if (!dateString) return "N/A";
  if (format === "time ago") {
    return dayjs(dateString).fromNow();
  }
  return dayjs(dateString).format(format);
};
