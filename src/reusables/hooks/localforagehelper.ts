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

async function persistViewPosts(postID: string, data: any) {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
  });
  localforage.setDriver(localforage.INDEXEDDB);
  localforage.config({ storeName: "viewcache" });
  const existingData: {
    duration: number;
    created_at: string;
    user_id: string;
  } | null = await localforage.getItem(postID);

  let pendingData = {
    duration: parseFloat(Number(data.duration).toFixed(3)),
    created_at: data.created_at,
    user_id: data.user_id,
  };

  if (existingData) {
    const totalDuration = existingData.duration + data.duration;
    pendingData = {
      duration: parseFloat(Number(totalDuration).toFixed(3)),
      created_at: existingData.created_at,
      user_id: existingData.user_id,
    };
  }

  return await localforage.setItem(postID, pendingData).then(async () => {
    return true;
  });
}

async function clearViewPosts() {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
    storeName: "viewcache",
  });

  localforage.setDriver(localforage.INDEXEDDB);
  await localforage.ready();

  return await localforage
    .clear()
    .then(() => {
      return true;
    })
    .catch((err) => {
      console.error("Clear failed:", err);
      return false;
    });
}

async function getAllViewCache(current_user_id: string) {
  const localforage = localforagemain.createInstance({
    name: "chatterloop",
    storeName: "viewcache",
  });

  localforage.setDriver(localforage.INDEXEDDB);
  await localforage.ready();

  try {
    const keys = await localforage.keys();

    const allItems: any = {};
    for (const key of keys) {
      const value: any = await localforage.getItem(key);
      allItems[key] = { post_id: key, ...value };
    }

    return Object.values(allItems)
      .filter((item: any) => item.user_id === current_user_id)
      .map((item: any) => ({
        post_id: item.post_id,
        duration: item.duration,
        created_at: item.created_at,
      }));
  } catch (error) {
    console.error("Failed to get items:", error);
    return {};
  }
}

export {
  getLottieData,
  persistLottieData,
  persistAndReturnImage,
  persistViewPosts,
  clearViewPosts,
  getAllViewCache,
};
