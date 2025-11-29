/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

export { getLottieData, persistLottieData };
