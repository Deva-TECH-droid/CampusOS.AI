import Club       from "../models/Club.js";
import Event      from "../models/Event.js";
import Drive      from "../models/Drive.js";
import Discussion from "../models/Discussion.js";

export const searchAll = async (q) => {
  const regex = new RegExp(q.trim(), "i"); // to  make it case sensitive

  const [clubs, events, drives, discussions] = await Promise.all([ // Promiseall starts all 4 together
    Club.find({
      isActive: true,
      $or: [{ clubName: regex }, { description: regex }],
    })
      .select("_id clubName description logo")
      .limit(5)
      .lean(), // lean returns plain js objects instead of mongoose documents, you can just read em , cant to operations like save , validate,populate

    Event.find({
      $or: [{ eventName: regex }, { description: regex }],
    })
      .select("_id eventName banner startDateTime")
      .limit(5)
      .lean(),

    Drive.find({
      $or: [{ companyName: regex }, { role: regex }],
    })
      .select("_id companyName companyLogo role")
      .limit(5)
      .lean(),

    Discussion.find({ title: regex, isDeleted: false })
      .select("_id title author")
      .populate("author", "firstName lastName")
      .limit(5)
      .lean(),
  ]);

  return [  //creating just one plain array of objects
    ...clubs.map((c) => ({
      _id:      c._id,
      type:     "club",
      title:    c.clubName,
      subtitle: c.description?.slice(0, 60) || "Club",
      image:    c.logo || null,
      url:      `/community/clubs/${c._id}`,
    })),
    ...events.map((e) => ({
      _id:      e._id,
      type:     "event",
      title:    e.eventName,
      subtitle: e.startDateTime
        ? new Date(e.startDateTime).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          })
        : "Event",
      image:    e.banner || null,
      url:      `/community/events/${e._id}`,
    })),
    ...drives.map((d) => ({
      _id:      d._id,
      type:     "drive",
      title:    d.companyName,
      subtitle: d.role,
      image:    d.companyLogo || null,
      url:      `/career/drives/${d._id}`,
    })),
    ...discussions.map((d) => ({
      _id:      d._id,
      type:     "discussion",
      title:    d.title,
      subtitle: d.author
        ? `by ${d.author.firstName} ${d.author.lastName}`
        : "Discussion",
      image:    null,
      url:      `/discussions/${d._id}`,
    })),
  ];
};