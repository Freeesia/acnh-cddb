export const sleep = (val: number) => {
  return new Promise(res => {
    setTimeout(() => {
      res();
    }, val);
  });
};

export function includePartRegex(targets: string[]) {
  return new RegExp(`(${targets.join("|")})`, "i");
}
