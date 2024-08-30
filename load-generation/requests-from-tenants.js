import http from "k6/http";
import {
  randomItem,
  randomIntBetween,
} from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { sleep } from "k6";

const tenantId = [
  "63VA3W6D",
  "11SJ2HQ0",
  "NZPSA20W",
  "86M1IMKS",
  "U4JKRXUE",
  "P2GTPI4A",
  "B9D2Y3OX",
  "W7AC6NYT",
  "I57L58HP",
  "3C4UDSSB",
];

const userId = ["mike", "dan", "todd", "kim", "tom", "evan", "armin", "georg"];

export const options = {
  vus: 75,
  duration: "20m",
};

export default function () {
  // const url = "http://34.69.107.204";
  const url = "http://localhost:3000";

  const params = {
    headers: {
      "X-Tenant": randomItem(tenantId),
    },
  };
  http.get(`${url}/favorites`, params);
  sleep(randomIntBetween(5, 20));
  http.get(`${url}/favorites/${randomItem(userId)}`, params);
}
