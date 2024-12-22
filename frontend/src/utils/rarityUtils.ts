// src/utils/rarityUtils.ts

export const rarityColors: { [key: number]: string } = {
    1: "green",
    2: "blue",
    3: "purple",
    4: "orange",
  };
  
  export const rarityLabels: { [key: number]: string } = {
    1: "Common",
    2: "Uncommon",
    3: "Rare",
    4: "Super Rare",
  };
  
  export const truncateAddress = (address: string, start = 6, end = 4) => {
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };