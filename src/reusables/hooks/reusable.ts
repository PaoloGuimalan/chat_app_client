import { IContact } from "../vars/interfaces";
import { ConvertedResponse, OriginalResponse } from "../vars/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function importData(resolve: any, rawresolve: any) {
  const input: any = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/*"; /** "image/x-png, image/gif, image/jpeg" */
  input.onchange = () => {
    const files = Array.from(input.files);
    files.map((flmp: any) => {
      getBase64(flmp, "default", "image", resolve);
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
    (flt: any) => flt.sessionStatus == true
  );
  const activeusersmapper = filteractiveusers.map((mp: any) => mp._id);
  if (activeusersmapper.includes(userID)) {
    return true;
  } else {
    return false;
  }
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

function formattedDateToWords(formattedDate: string) {
  const splittedDate = formattedDate.split("/");
  const month = splittedDate[0];
  const day = splittedDate[1];
  const year = splittedDate[2];

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
    return '<a href="' + url + '" target="_blank">' + url + "</a>";
  });
  // or alternatively
  // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

function convertLoginResponse(response: OriginalResponse): ConvertedResponse {
  const birthdate = new Date(response.birthdate);
  const dateCreated = new Date(response.date_created);

  function formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const twoDigit = (n: number) => (n < 10 ? "0" + n : n);

    return `${twoDigit(hours)}:${twoDigit(minutes)}:${twoDigit(
      seconds
    )} ${ampm}`;
  }

  const monthName = birthdate.toLocaleString("en-US", { month: "long" });

  return {
    fullname: {
      firstName: response.first_name,
      middleName: response.middle_name,
      lastName: response.last_name,
    },
    birthdate: {
      month: monthName,
      day: birthdate.getDate().toString().padStart(2, "0"),
      year: birthdate.getFullYear().toString(),
    },
    dateCreated: {
      date: dateCreated.toLocaleDateString("en-US"),
      time: formatTime(dateCreated),
    },
    id: response.id, // fixed example value
    userID: response.username,
    profile: response.profile,
    gender: response.gender.charAt(0).toUpperCase() + response.gender.slice(1),
    email: response.email,
    password: null,
    isActivated: response.is_active,
    isVerified: response.is_verified,
    __v: 0,
    iat: response.iat,
    exp: response.exp,
  };
}

function contactsToUserdetails(contact: IContact, isUserOne: boolean) {
  if (isUserOne) {
    return {
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
};
