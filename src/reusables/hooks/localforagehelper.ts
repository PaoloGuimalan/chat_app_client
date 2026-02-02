/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Axios from "axios";
import localforagemain from "localforage";

async function getLottieData(stname: string, url: string) {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
  });
  localforage.setDriver(localforage.INDEXEDDB);
  localforage.config({ storeName: stname });
  return await localforage.getItem(url).then((value: any) => {
    return value;
  });
}

async function persistLottieData(stname: string, url: string, lottie: any) {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
  });
  localforage.setDriver(localforage.INDEXEDDB);
  localforage.config({ storeName: stname });
  return await localforage.setItem(url, lottie).then(async () => {
    return await localforage.getItem(url).then((value: any) => {
      return value;
    });
  });
}

async function persistAndReturnImage(stname: string, url: string) {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
  });
  localforage.setDriver(localforage.INDEXEDDB);
  localforage.config({ storeName: stname });

  const cachedImage = await localforage.getItem<Blob>(url);

  if (cachedImage) {
    return URL.createObjectURL(cachedImage);
  }

  Axios.get(url, { responseType: "blob" })
    .then((response) => {
      const blob = response.data;
      return localforage.setItem(url, blob);
    })
    .catch((err) => {
      console.log(err);
    });

  return url;
}

async function getCachedRoads(stname: string, url: string) {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
  });
  localforage.setDriver(localforage.INDEXEDDB);
  localforage.config({ storeName: stname });
  return await localforage.getItem(url).then((value: any) => {
    return value;
  });
}

async function persistCachedRoads(stname: string, url: string, lottie: any) {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
  });
  localforage.setDriver(localforage.INDEXEDDB);
  localforage.config({ storeName: stname });
  return await localforage.setItem(url, lottie).then(async () => {
    return await localforage.getItem(url).then((value: any) => {
      return value;
    });
  });
}

export {
  getLottieData,
  persistLottieData,
  persistAndReturnImage,
  getCachedRoads,
  persistCachedRoads,
};
