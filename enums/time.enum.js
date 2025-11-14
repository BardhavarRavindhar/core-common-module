/**
 * @module Time
 * 
 * This module defines the timer constants.
 */


const Time = Object.freeze({
  /** Constants **/
  weekDays: {
    "MON": "MON",
    "TUE": "TUE",
    "WED": "WED",
    "THU": "THU",
    "FRI": "FRI",
    "SAT": "SAT",
    "SUN": "SUN"
  },
  dateFormat: "dd-MM-yyyy",
  timeFormat: "HH:mm:ss",
  slotFormat: "dd-MM-yyyy HH:mm",
  slotTimeFormat: "HH:mm",
  slotDateFormat: "dd-MM-yyyy",
  humanTimeFormat: "HH:mm a",
  humanFormat: "dd-MM-yyyy HH:mm:ss a",
  humanLocalFormat: "MMM dd, yyyy 'At' h:mm a",
  timezone: "UTC",

  /** Helper Methods **/
  getWeekDays() {
    return Object.keys(this.weekDays);
  },

  provideMinsFromTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
});

export default Time;