export const sleep = (val: number) => {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, val);
  });
};
