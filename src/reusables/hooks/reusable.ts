import { usersettingsstate } from "@/redux/actions/states";
import { IContact, IUserSettings } from "../vars/interfaces";
import { ConvertedResponse, OriginalResponse } from "../vars/types";
import envs from "./env_configs";

/* eslint-disable @typescript-eslint/no-explicit-any */
function importData(resolve: any, rawresolve: any) {
  const input: any = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/*"; /** "image/x-png, image/gif, image/jpeg" */
  input.onchange = () => {
    const files = Array.from(input.files);
    files.map((flmp: any) => {
      getBase64(flmp, flmp.name, "image", resolve);
      rawresolve(flmp);
    });
  };
  input.click();
}

function importNonImageData(resolve: any, rawresolve: any) {
  const input: any = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  // input.accept = "image/*"; /** "image/x-png, image/gif, image/jpeg" */
  input.onchange = () => {
    const files = Array.from(input.files);
    files.map((flmp: any) => {
      if (Math.round(+flmp.size / 1024) / 1000 > 25) {
        resolve(false);
        rawresolve(false);
      } else {
        // console.log(flmp.name)
        getBase64(flmp, flmp.name, flmp.type, resolve);
        rawresolve({
          name: flmp.name,
          type: flmp.type,
          data: flmp,
        });
      }
    });
  };
  input.click();
}

function getBase64(file: any, name: string, type: string, resolve: any) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    resolve({
      name: name,
      type: type,
      data: reader.result,
    });
  };

  return reader;
}

function makeid(length: number) {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function isUserOnline(state: any, userID: string) {
  const filteractiveusers = state.filter(
    (flt: any) => flt.sessionStatus == true,
  );
  const activeusersmapper = filteractiveusers.map((mp: any) => mp._id);
  if (activeusersmapper.includes(userID)) {
    return true;
  } else {
    return false;
  }
}

function userSessionStatusFromContacts(state: any, userID: string) {
  const filteractiveusers = state.filter((flt: any) => flt._id === userID);

  if (filteractiveusers.length > 0) {
    const sessionDate = filteractiveusers[0].sessiondate;

    if (sessionDate) {
      if (sessionDate.time) {
        return `Last seen ${sessionDate.date}`;
      }

      return timeSince(sessionDate.date);
    }

    return null;
  }

  return null;
}

function ordinal_suffix_of(i: number) {
  const j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

function formattedDateToWords(formattedDate: string, format?: string) {
  let splittedDate;
  let month;
  let day;
  let year;

  if (format === "YYYY-MM-DD") {
    splittedDate = formattedDate.split("-");
    month = splittedDate[1];
    day = splittedDate[2];
    year = splittedDate[0];
  } else {
    splittedDate = formattedDate.split("/");
    month = splittedDate[0];
    day = splittedDate[1];
    year = splittedDate[2];
  }

  const mL = [
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

  const finalDateToWords = `${ordinal_suffix_of(parseInt(day))} of ${
    mL[parseInt(month) - 1]
  } ${year}`;

  return finalDateToWords;
}

function urlify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function (url) {
    return (
      '<a href="' +
      url +
      '" target="_blank" style="color: inherit;">' +
      url +
      "</a>"
    );
  });
  // or alternatively
  // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

function convertLoginResponse(response: OriginalResponse): ConvertedResponse {
  const birthdate = response.birthdate ? new Date(response.birthdate) : null;
  const dateCreated = new Date(response.date_created);

  function formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;

    const twoDigit = (n: number) => (n < 10 ? "0" + n : n);

    return `${twoDigit(hours)}:${twoDigit(minutes)}:${twoDigit(
      seconds,
    )} ${ampm}`;
  }

  // Handle birthdate safely
  let birthdateFormatted = null;
  if (birthdate && !isNaN(birthdate.getTime())) {
    const monthName = birthdate.toLocaleString("en-US", { month: "long" });
    birthdateFormatted = {
      month: monthName,
      day: birthdate.getDate().toString().padStart(2, "0"),
      year: birthdate.getFullYear().toString(),
    };
  }

  // Handle gender safely
  let genderFormatted = null;
  if (
    response.gender &&
    typeof response.gender === "string" &&
    response.gender.trim() !== ""
  ) {
    genderFormatted =
      response.gender.charAt(0).toUpperCase() +
      response.gender.slice(1).toLowerCase();
  }

  return {
    fullname: {
      firstName: response.first_name || "",
      middleName: response.middle_name || "",
      lastName: response.last_name || "",
    },
    birthdate: birthdateFormatted,
    dateCreated: {
      date: dateCreated.toLocaleDateString("en-US"),
      time: formatTime(dateCreated),
    },
    id: response.id,
    userID: response.id,
    username: response.username,
    profile: response.profile || "none",
    gender: genderFormatted,
    email: response.email || "",
    password: null,
    isActivated: response.is_active,
    isVerified: response.is_verified,
    isComplete: response.is_complete,
    pendingConsents: response.pending_consents || [],
    __v: 0,
    iat: response.iat,
    exp: response.exp,
  };
}

function contactsToUserdetails(contact: IContact, isUserOne: boolean) {
  if (isUserOne) {
    return {
      _id: contact.action_by.id,
      userID: contact.action_by.username,
      fullname: {
        firstName: contact.action_by.first_name,
        middleName: contact.action_by.middle_name,
        lastName: contact.action_by.last_name,
      },
      profile: contact.action_by.profile,
      coverphoto: "",
    };
  }

  return {
    _id: contact.involved_user.id,
    userID: contact.involved_user.username,
    fullname: {
      firstName: contact.involved_user.first_name,
      middleName: contact.involved_user.middle_name,
      lastName: contact.involved_user.last_name,
    },
    profile: contact.involved_user.profile,
    coverphoto: "",
  };
}

function monthNameToNumber(monthName: string) {
  // Create a Date object by parsing string with day 1 and year arbitrary (e.g., 2000)
  const date = new Date(`${monthName} 1, 2000`);
  // getMonth() returns 0-based month index, so add 1 for 1-based month number
  const monthNumber = date.getMonth() + 1;
  return monthNumber;
}

const formatToDjangoDate = (date: any) => {
  if (!date) return null;

  // Get user's ACTUAL timezone offset (e.g., +0800 for PST)
  const offsetMs = date.getTimezoneOffset() * 60000;
  const offsetHours = Math.floor(Math.abs(offsetMs) / 3600000);
  const offsetMinutes = Math.floor((Math.abs(offsetMs) % 3600000) / 60000);
  const sign = offsetMs <= 0 ? "+" : "-";
  const offsetStr = `${sign}${offsetHours.toString().padStart(2, "0")}${offsetMinutes.toString().padStart(2, "0")}`;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms} ${offsetStr}`;
};

const getFormattedDate = (
  monthName: string,
  dayStr: string,
  yearStr: string,
): string | null => {
  const monthMap: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const numericMonth = monthMap[monthName.trim().toLowerCase()];
  if (!numericMonth || !dayStr || !yearStr) return null;
  const numericDay = dayStr.trim().padStart(2, "0");
  const numericYear = yearStr.trim();
  return `${numericYear}-${numericMonth}-${numericDay} 08:00:00.000 +0800`;
};

function timeSince(dateString: any) {
  const now: any = new Date();
  const past: any = new Date(dateString);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 5) {
    return "just now";
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  // For longer times, return formatted date string
  return past.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const parseDjangoDate = (djangoStr: any) => {
  if (!djangoStr) return null;

  try {
    // Split: "2026-07-30 00:00:00.000 +0800"
    const [datePart, timePartWithOffset] = djangoStr.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);

    // Split time: "00:00:00.000" → remove timezone part
    const timePart = timePartWithOffset.split(" ")[0];
    const timeComponents = timePart.split(":");

    const hours = parseInt(timeComponents[0]);
    const minutes = parseInt(timeComponents[1]);
    const secondsAndMs = timeComponents[2].split(".");
    const seconds = parseInt(secondsAndMs[0]);
    const ms = secondsAndMs[1] ? parseInt(secondsAndMs[1]) : 0;

    // Create local Date object
    const date = new Date(year, month - 1, day, hours, minutes, seconds, ms);

    // Validate
    if (isNaN(date.getTime())) return null;

    return date;
  } catch (error) {
    console.error("Parse error:", error, djangoStr);
    return null;
  }
};

function isUserSettingsComplete(
  settings: IUserSettings,
): settings is IUserSettings {
  const validateAgainstDefault = (obj: any, defaultObj: any): boolean => {
    if (obj === null || obj === undefined)
      return defaultObj === null || defaultObj === undefined;
    if (typeof obj !== typeof defaultObj) return false;
    if (typeof obj !== "object" || Array.isArray(obj)) return true;

    for (const [key, defaultValue] of Object.entries(defaultObj)) {
      if (!(key in obj)) return false;
      if (!validateAgainstDefault(obj[key], defaultValue)) return false;
    }
    return true;
  };

  return validateAgainstDefault(settings, usersettingsstate);
}

function sanitizeForStorage(content: string) {
  if (!content) return "";
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function generateXNonce(userId: string) {
  const secret = envs.SECRET;
  const encoder = new TextEncoder();

  const hashedSecret = await window.crypto.subtle.digest(
    "SHA-256",
    encoder.encode(secret),
  );

  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.random().toString(36).substring(2, 10);
  const plainText = `${userId}.${timestamp}.${random}`;

  const key = await window.crypto.subtle.importKey(
    "raw",
    hashedSecret,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(plainText),
  );

  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const cipherTextHex = Array.from(new Uint8Array(encryptedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${ivHex}.${cipherTextHex}`;
}

function hasNullValues(obj: any): any {
  if (obj === null || obj === undefined) return true;

  if (typeof obj === "string") {
    return obj.trim() === "";
  }

  if (Array.isArray(obj)) {
    return obj.length === 0 || obj.some(hasNullValues);
  }

  if (typeof obj !== "object") return false;

  // Check object properties
  for (const value of Object.values(obj)) {
    if (hasNullValues(value)) return true;
  }

  return false;
}

function getDifferentValues(obj1: any, obj2: any) {
  const differences: any = {};

  for (const [key, value] of Object.entries(obj2)) {
    if (!(key in obj1) || obj1[key] !== value) {
      differences[key] = value;
    }
  }

  return differences;
}

function capitalizeFirstLetter(str: string) {
  if (!str) return str; // Handle empty strings
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function is13YearsOldOrAbove(dateStr: string) {
  // Parse the input date string (e.g., "2002-02-14 08:00:00.000 +0800")
  const parts = dateStr.trim().split(" ");
  const dateTimePart = parts[0]; // "2002-02-14"
  const timePart = parts[1]; // "08:00:00.000"
  const tzPart = parts[2]; // "+0800"

  // Convert timezone offset "+0800" to format "+08:00" for Date parsing
  const tzOffset = tzPart.slice(0, 3) + ":" + tzPart.slice(3, 5);

  // Build a parseable date string
  const fullDateStr = `${dateTimePart}T${timePart}${tzOffset}`;

  const targetDate = new Date(fullDateStr);

  // Check if date is invalid (Date.toString() returns "Invalid Date")
  if (targetDate.toString() === "Invalid Date" || !targetDate.getTime()) {
    throw new Error("Invalid date format");
  }

  const currentDate = new Date();

  // Calculate the difference in years
  let yearsDiff = currentDate.getFullYear() - targetDate.getFullYear();

  // Adjust if the current date hasn't reached the target date's month/day yet this year
  const currentMonthDay = currentDate.getMonth() * 32 + currentDate.getDate();
  const targetMonthDay = targetDate.getMonth() * 32 + targetDate.getDate();

  if (currentMonthDay < targetMonthDay) {
    yearsDiff--;
  }

  return yearsDiff >= 13;
}

export {
  importData,
  importNonImageData,
  getBase64,
  makeid,
  isUserOnline,
  formattedDateToWords,
  ordinal_suffix_of,
  urlify,
  convertLoginResponse,
  contactsToUserdetails,
  monthNameToNumber,
  formatToDjangoDate,
  parseDjangoDate,
  timeSince,
  userSessionStatusFromContacts,
  isUserSettingsComplete,
  sanitizeForStorage,
  generateXNonce,
  hasNullValues,
  getDifferentValues,
  capitalizeFirstLetter,
  generateUUID,
  getFormattedDate,
  is13YearsOldOrAbove,
};
